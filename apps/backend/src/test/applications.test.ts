import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import Application from '../models/Application';
import {
  app,
  clearTestDB,
  connectTestDB,
  createProperty,
  createUser,
  disconnectTestDB,
} from './helpers';

beforeAll(connectTestDB);
afterEach(clearTestDB);
afterAll(disconnectTestDB);

const apply = (
  token: string,
  propertyId: string,
  body: Record<string, unknown> = {}
) =>
  request(app)
    .post('/api/applications')
    .set('Authorization', `Bearer ${token}`)
    .send({
      propertyId,
      message: 'I can move in at the start of the next cycle.',
      ...body,
    });

describe('POST /api/applications', () => {
  it('requires authentication', async () => {
    const response = await request(app)
      .post('/api/applications')
      .send({ propertyId: '0123456789abcdef01234567', message: 'Hello' });

    expect(response.status).toBe(401);
  });

  it('files an application against the unit and derives the host', async () => {
    const host = await createUser('host');
    const renter = await createUser('renter');
    const property = await createProperty(host.id);

    const response = await apply(renter.token, property.id);

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      status: 'pending',
      host: host.id,
      applicant: renter.id,
    });
    expect(response.body.data.property.title).toBe(property.title);
  });

  it('rejects an empty message', async () => {
    const host = await createUser('host');
    const renter = await createUser('renter');
    const property = await createProperty(host.id);

    const response = await apply(renter.token, property.id, { message: '   ' });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/why you are applying/i);
  });

  it('rejects an invalid move-in date', async () => {
    const host = await createUser('host');
    const renter = await createUser('renter');
    const property = await createProperty(host.id);

    const response = await apply(renter.token, property.id, { moveInDate: 'not-a-date' });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/valid date/i);
  });

  it('rejects applying to your own listing', async () => {
    const host = await createUser('host');
    const property = await createProperty(host.id);

    const response = await apply(host.token, property.id);

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/own listing/i);
  });

  it('rejects applying to a withdrawn unit', async () => {
    const host = await createUser('host');
    const renter = await createUser('renter');
    const property = await createProperty(host.id, { isAvailable: false });

    const response = await apply(renter.token, property.id);

    expect(response.status).toBe(409);
    expect(response.body.error).toMatch(/not accepting/i);
  });

  it('rejects a duplicate application', async () => {
    const host = await createUser('host');
    const renter = await createUser('renter');
    const property = await createProperty(host.id);

    await apply(renter.token, property.id);
    const response = await apply(renter.token, property.id);

    expect(response.status).toBe(409);
    expect(response.body.error).toMatch(/already applied/i);
  });
});

describe('GET /api/applications/mine', () => {
  it('returns only the caller’s applications with the property attached', async () => {
    const host = await createUser('host');
    const renter = await createUser('renter');
    const otherRenter = await createUser('renter', 'other-renter@backroom.test');
    const mine = await createProperty(host.id, { title: 'My Application Unit' });
    const theirs = await createProperty(host.id, { title: 'Someone Else Unit' });

    await apply(renter.token, mine.id);
    await apply(otherRenter.token, theirs.id);

    const response = await request(app)
      .get('/api/applications/mine')
      .set('Authorization', `Bearer ${renter.token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].property.title).toBe('My Application Unit');
  });
});

describe('GET /api/applications/received', () => {
  it('shows a host only applications for their own units', async () => {
    const host = await createUser('host');
    const otherHost = await createUser('host', 'other-host@backroom.test');
    const renter = await createUser('renter');
    const myUnit = await createProperty(host.id, { title: 'My Unit' });
    const otherUnit = await createProperty(otherHost.id, { title: 'Other Unit' });

    await apply(renter.token, myUnit.id);
    await apply(renter.token, otherUnit.id);

    const response = await request(app)
      .get('/api/applications/received')
      .set('Authorization', `Bearer ${host.token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].property.title).toBe('My Unit');
    expect(response.body.data[0].applicant).toMatchObject({
      name: 'Test renter',
      email: 'renter@backroom.test',
    });
  });

  it('forbids renters from reading the host inbox', async () => {
    const renter = await createUser('renter');
    const response = await request(app)
      .get('/api/applications/received')
      .set('Authorization', `Bearer ${renter.token}`);

    expect(response.status).toBe(403);
  });
});

describe('PATCH /api/applications/:id/status', () => {
  const decide = (token: string, id: string, status: string) =>
    request(app)
      .patch(`/api/applications/${id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status });

  it('lets the host accept an application', async () => {
    const host = await createUser('host');
    const renter = await createUser('renter');
    const property = await createProperty(host.id);
    const application = await apply(renter.token, property.id);

    const response = await decide(host.token, application.body.data._id, 'accepted');

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('accepted');
  });

  it('lets an admin review any application', async () => {
    const host = await createUser('host');
    const renter = await createUser('renter');
    const admin = await createUser('admin');
    const property = await createProperty(host.id);
    const application = await apply(renter.token, property.id);

    const response = await decide(admin.token, application.body.data._id, 'declined');

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('declined');
  });

  it('forbids a different host from reviewing', async () => {
    const host = await createUser('host');
    const otherHost = await createUser('host', 'other-host@backroom.test');
    const renter = await createUser('renter');
    const property = await createProperty(host.id);
    const application = await apply(renter.token, property.id);

    const response = await decide(otherHost.token, application.body.data._id, 'accepted');

    expect(response.status).toBe(403);
  });

  it('rejects an unsupported status', async () => {
    const host = await createUser('host');
    const renter = await createUser('renter');
    const property = await createProperty(host.id);
    const application = await apply(renter.token, property.id);

    const response = await decide(host.token, application.body.data._id, 'pending');

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/accepted or declined/i);
  });

  it('cannot review an application the applicant withdrew', async () => {
    const host = await createUser('host');
    const renter = await createUser('renter');
    const property = await createProperty(host.id);
    const application = await apply(renter.token, property.id);

    await request(app)
      .patch(`/api/applications/${application.body.data._id}/withdraw`)
      .set('Authorization', `Bearer ${renter.token}`);

    const response = await decide(host.token, application.body.data._id, 'accepted');

    expect(response.status).toBe(409);
  });
});

describe('PATCH /api/applications/:id/withdraw', () => {
  it('lets the applicant withdraw a pending application', async () => {
    const host = await createUser('host');
    const renter = await createUser('renter');
    const property = await createProperty(host.id);
    const application = await apply(renter.token, property.id);

    const response = await request(app)
      .patch(`/api/applications/${application.body.data._id}/withdraw`)
      .set('Authorization', `Bearer ${renter.token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('withdrawn');
  });

  it('forbids another user from withdrawing it', async () => {
    const host = await createUser('host');
    const renter = await createUser('renter');
    const otherRenter = await createUser('renter', 'other-renter@backroom.test');
    const property = await createProperty(host.id);
    const application = await apply(renter.token, property.id);

    const response = await request(app)
      .patch(`/api/applications/${application.body.data._id}/withdraw`)
      .set('Authorization', `Bearer ${otherRenter.token}`);

    expect(response.status).toBe(403);
  });
});

describe('property deletion', () => {
  it('removes applications for a unit that is withdrawn from the registry', async () => {
    const host = await createUser('host');
    const renter = await createUser('renter');
    const property = await createProperty(host.id);
    await apply(renter.token, property.id);

    const response = await request(app)
      .delete(`/api/properties/${property.id}`)
      .set('Authorization', `Bearer ${host.token}`);

    expect(response.status).toBe(200);
    expect(await Application.countDocuments({ property: property.id })).toBe(0);
  });
});
