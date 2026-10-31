import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../app';
import User from '../models/User';
import { clearTestDB, connectTestDB, disconnectTestDB } from './helpers';

beforeAll(connectTestDB);
afterEach(clearTestDB);
afterAll(disconnectTestDB);

describe('POST /api/auth/register', () => {
  it('creates a renter and returns a token', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: 'Ada',
      email: 'ada@backroom.test',
      password: 'password123',
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      name: 'Ada',
      email: 'ada@backroom.test',
      role: 'renter',
    });
    expect(response.body.data.token).toEqual(expect.any(String));
    expect(response.body.data.password).toBeUndefined();

    const stored = await User.findOne({ email: 'ada@backroom.test' });
    expect(stored).not.toBeNull();
    expect(stored?.password).not.toBe('password123');
  });

  it('ignores a role supplied in the request body', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: 'Mallory',
      email: 'mallory@backroom.test',
      password: 'password123',
      role: 'admin',
    });

    expect(response.status).toBe(201);
    expect(response.body.data.role).toBe('renter');
  });

  it('normalises the email address', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: 'Grace',
      email: '  Grace@Backroom.Test ',
      password: 'password123',
    });

    expect(response.status).toBe(201);
    expect(response.body.data.email).toBe('grace@backroom.test');
  });

  it.each([
    [{ name: 'No Email', password: 'password123' }, 'required'],
    [{ name: 'Bad Email', email: 'not-an-email', password: 'password123' }, 'valid email'],
    [{ name: 'Short', email: 'short@backroom.test', password: '123' }, 'at least 6'],
  ])('rejects invalid registration payloads', async (payload, message) => {
    const response = await request(app).post('/api/auth/register').send(payload);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain(message);
  });

  it('rejects a duplicate email with 409', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'First',
      email: 'duplicate@backroom.test',
      password: 'password123',
    });

    const response = await request(app).post('/api/auth/register').send({
      name: 'Second',
      email: 'duplicate@backroom.test',
      password: 'password123',
    });

    expect(response.status).toBe(409);
    expect(response.body.error).toMatch(/already exists/i);
  });
});

describe('POST /api/auth/login', () => {
  it('returns a token for valid credentials', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Lin',
      email: 'lin@backroom.test',
      password: 'password123',
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'LIN@backroom.test', password: 'password123' });

    expect(response.status).toBe(200);
    expect(response.body.data.token).toEqual(expect.any(String));
  });

  it('rejects a wrong password with 401', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Lin',
      email: 'lin@backroom.test',
      password: 'password123',
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'lin@backroom.test', password: 'wrong-password' });

    expect(response.status).toBe(401);
    expect(response.body.error).toMatch(/invalid email or password/i);
  });

  it('does not reveal whether the account exists', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@backroom.test', password: 'password123' });

    expect(response.status).toBe(401);
    expect(response.body.error).toMatch(/invalid email or password/i);
  });
});

describe('protected routes', () => {
  it('returns 401 without a token', async () => {
    const response = await request(app).get('/api/users/favorites');
    expect(response.status).toBe(401);
  });

  it('returns 401 for a malformed token', async () => {
    const response = await request(app)
      .get('/api/users/favorites')
      .set('Authorization', 'Bearer not-a-real-token');
    expect(response.status).toBe(401);
  });
});
