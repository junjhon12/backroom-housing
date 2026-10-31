import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import Property from '../models/Property';
import User from '../models/User';
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

describe('GET /api/properties', () => {
  it('returns only available listings with pagination metadata', async () => {
    const host = await createUser('host');
    await createProperty(host.id, { title: 'Open Unit' });
    await createProperty(host.id, { title: 'Withdrawn Unit', isAvailable: false });

    const response = await request(app).get('/api/properties');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].title).toBe('Open Unit');
    expect(response.body.meta).toMatchObject({
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });
  });

  it('paginates with a bounded limit', async () => {
    const host = await createUser('host');
    await Promise.all(
      ['One', 'Two', 'Three'].map((title) => createProperty(host.id, { title }))
    );

    const first = await request(app).get('/api/properties?limit=2&page=1');
    const second = await request(app).get('/api/properties?limit=2&page=2');

    expect(first.body.data).toHaveLength(2);
    expect(first.body.meta.totalPages).toBe(2);
    expect(second.body.data).toHaveLength(1);
  });

  it('filters by rent range and minimum bedrooms', async () => {
    const host = await createUser('host');
    await createProperty(host.id, { title: 'Cheap Studio', price: 500, bedrooms: 0 });
    await createProperty(host.id, { title: 'Family Unit', price: 2400, bedrooms: 3 });

    const byPrice = await request(app).get('/api/properties?maxPrice=1000');
    expect(byPrice.body.data.map((p: { title: string }) => p.title)).toEqual(['Cheap Studio']);

    const byBedrooms = await request(app).get('/api/properties?bedrooms=2');
    expect(byBedrooms.body.data.map((p: { title: string }) => p.title)).toEqual(['Family Unit']);
  });

  it('rejects an inverted price range', async () => {
    const response = await request(app).get('/api/properties?minPrice=900&maxPrice=100');
    expect(response.status).toBe(400);
  });

  it('runs keyword search against the text index', async () => {
    const host = await createUser('host');
    await createProperty(host.id, {
      title: 'Corner Office',
      description: 'Original carpet and a working coffee machine.',
    });
    await createProperty(host.id, {
      title: 'Pipe Loft',
      description: 'Warm, humid, and loud enough that the hum becomes company.',
    });

    const response = await request(app).get('/api/properties?keyword=coffee');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].title).toBe('Corner Office');
  });

  it('rejects an invalid id with 400', async () => {
    const response = await request(app).get('/api/properties/not-an-object-id');
    expect(response.status).toBe(400);
  });
});

describe('GET /api/properties/:id', () => {
  it('returns a listing that exists and 404 otherwise', async () => {
    const host = await createUser('host');
    const property = await createProperty(host.id);

    const found = await request(app).get(`/api/properties/${property.id}`);
    expect(found.status).toBe(200);
    expect(found.body.data.title).toBe(property.title);

    const missing = await request(app).get('/api/properties/0123456789abcdef01234567');
    expect(missing.status).toBe(404);
  });
});

describe('POST /api/properties', () => {
  it('requires authentication', async () => {
    const response = await request(app).post('/api/properties').send({});
    expect(response.status).toBe(401);
  });

  it('forbids renters from creating listings', async () => {
    const renter = await createUser('renter');
    const response = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${renter.token}`)
      .send({});

    expect(response.status).toBe(403);
  });

  it('creates a listing owned by the authenticated host', async () => {
    const host = await createUser('host');
    const impostor = await createUser('renter', 'renter@backroom.test');

    const response = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${host.token}`)
      .send({
        title: 'The Lobby, Reclaimed',
        description: 'No windows.',
        price: 1450,
        level: 'Level 0',
        sector: 'Sector B-12',
        bedrooms: 1,
        bathrooms: 1,
        squareFeet: 620,
        host: impostor.id,
      });

    expect(response.status).toBe(201);
    expect(response.body.data.host).toBe(host.id);
  });

  it('rejects images that were not uploaded through the registry', async () => {
    const host = await createUser('host');
    const response = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${host.token}`)
      .send({
        title: 'External Image',
        description: 'No windows.',
        price: 900,
        level: 'Level 1',
        sector: 'Sector A-1',
        bedrooms: 1,
        bathrooms: 1,
        squareFeet: 300,
        images: ['https://example.com/photo.jpg'],
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/uploaded through the registry/i);
  });

  it('rejects more than six photographs', async () => {
    const host = await createUser('host');
    const response = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${host.token}`)
      .send({
        title: 'Too Many Photos',
        description: 'No windows.',
        price: 900,
        level: 'Level 1',
        sector: 'Sector A-1',
        bedrooms: 1,
        bathrooms: 1,
        squareFeet: 300,
        images: Array.from({ length: 7 }, (_, index) => `/uploads/image-${index}.jpg`),
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/at most 6/i);
  });
});

describe('GET /api/properties/me', () => {
  it('returns only the caller’s listings', async () => {
    const host = await createUser('host');
    const other = await createUser('host', 'other-host@backroom.test');
    await createProperty(host.id, { title: 'Mine' });
    await createProperty(other.id, { title: 'Theirs' });

    const response = await request(app)
      .get('/api/properties/me')
      .set('Authorization', `Bearer ${host.token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.map((p: { title: string }) => p.title)).toEqual(['Mine']);
  });
});

describe('PUT /api/properties/:id', () => {
  it('allows the owner to update editable fields', async () => {
    const host = await createUser('host');
    const property = await createProperty(host.id);

    const response = await request(app)
      .put(`/api/properties/${property.id}`)
      .set('Authorization', `Bearer ${host.token}`)
      .send({ title: 'Renamed Unit', price: 999 });

    expect(response.status).toBe(200);
    expect(response.body.data.title).toBe('Renamed Unit');
    expect(response.body.data.price).toBe(999);
  });

  it('forbids a different host from updating the listing', async () => {
    const owner = await createUser('host');
    const other = await createUser('host', 'other-host@backroom.test');
    const property = await createProperty(owner.id);

    const response = await request(app)
      .put(`/api/properties/${property.id}`)
      .set('Authorization', `Bearer ${other.token}`)
      .send({ title: 'Stolen' });

    expect(response.status).toBe(403);
  });

  it('allows an admin to update any listing', async () => {
    const host = await createUser('host');
    const admin = await createUser('admin');
    const property = await createProperty(host.id);

    const response = await request(app)
      .put(`/api/properties/${property.id}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ isAvailable: false });

    expect(response.status).toBe(200);
    expect(response.body.data.isAvailable).toBe(false);
  });

  it('cannot reassign ownership through the request body', async () => {
    const host = await createUser('host');
    const other = await createUser('host', 'other-host@backroom.test');
    const property = await createProperty(host.id);

    const response = await request(app)
      .put(`/api/properties/${property.id}`)
      .set('Authorization', `Bearer ${host.token}`)
      .send({ host: other.id });

    expect(response.status).toBe(200);
    expect(response.body.data.host).toBe(host.id);
  });
});

describe('DELETE /api/properties/:id', () => {
  it('removes the listing and clears references from saved lists', async () => {
    const host = await createUser('host');
    const renter = await createUser('renter');
    const property = await createProperty(host.id);

    await User.findByIdAndUpdate(renter.id, {
      $addToSet: { savedProperties: property.id },
    });

    const response = await request(app)
      .delete(`/api/properties/${property.id}`)
      .set('Authorization', `Bearer ${host.token}`);

    expect(response.status).toBe(200);
    expect(await Property.findById(property.id)).toBeNull();

    const updatedRenter = await User.findById(renter.id);
    expect(updatedRenter?.savedProperties).toHaveLength(0);
  });

  it('forbids non-owners from deleting', async () => {
    const owner = await createUser('host');
    const other = await createUser('host', 'other-host@backroom.test');
    const property = await createProperty(owner.id);

    const response = await request(app)
      .delete(`/api/properties/${property.id}`)
      .set('Authorization', `Bearer ${other.token}`);

    expect(response.status).toBe(403);
    expect(await Property.findById(property.id)).not.toBeNull();
  });
});

describe('favorites', () => {
  it('toggles a listing in the saved list', async () => {
    const host = await createUser('host');
    const renter = await createUser('renter');
    const property = await createProperty(host.id);

    const first = await request(app)
      .post(`/api/users/favorites/${property.id}`)
      .set('Authorization', `Bearer ${renter.token}`);
    expect(first.status).toBe(200);
    expect(first.body.data).toContain(property.id);

    const second = await request(app)
      .post(`/api/users/favorites/${property.id}`)
      .set('Authorization', `Bearer ${renter.token}`);
    expect(second.status).toBe(200);
    expect(second.body.data).not.toContain(property.id);
  });

  it('returns populated saved listings', async () => {
    const host = await createUser('host');
    const renter = await createUser('renter');
    const property = await createProperty(host.id, { title: 'Saved Unit' });

    await request(app)
      .post(`/api/users/favorites/${property.id}`)
      .set('Authorization', `Bearer ${renter.token}`);

    const response = await request(app)
      .get('/api/users/favorites')
      .set('Authorization', `Bearer ${renter.token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].title).toBe('Saved Unit');
  });

  it('rejects saving a listing that does not exist', async () => {
    const renter = await createUser('renter');
    const response = await request(app)
      .post('/api/users/favorites/0123456789abcdef01234567')
      .set('Authorization', `Bearer ${renter.token}`);

    expect(response.status).toBe(404);
  });
});
