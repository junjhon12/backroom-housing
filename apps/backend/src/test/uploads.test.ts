import fs from 'fs';
import path from 'path';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { UPLOADS_DIR } from '../config/paths';
import {
  app,
  clearTestDB,
  connectTestDB,
  createUser,
  disconnectTestDB,
} from './helpers';

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const uploadedFiles = (): Set<string> =>
  new Set(fs.readdirSync(UPLOADS_DIR).filter((name) => name.startsWith('image-')));

beforeAll(async () => {
  await connectTestDB();
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
});
afterEach(clearTestDB);
afterAll(async () => {
  await disconnectTestDB();
  for (const name of uploadedFiles()) {
    fs.unlinkSync(path.join(UPLOADS_DIR, name));
  }
});

describe('POST /api/upload', () => {
  it('requires authentication', async () => {
    const response = await request(app)
      .post('/api/upload')
      .attach('image', Buffer.concat([PNG_SIGNATURE, Buffer.alloc(8)]), {
        filename: 'photo.png',
        contentType: 'image/png',
      });

    expect(response.status).toBe(401);
  });

  it('forbids renters from uploading', async () => {
    const renter = await createUser('renter');
    const response = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${renter.token}`)
      .attach('image', Buffer.concat([PNG_SIGNATURE, Buffer.alloc(8)]), {
        filename: 'photo.png',
        contentType: 'image/png',
      });

    expect(response.status).toBe(403);
  });

  it('stores a valid PNG and returns a public URL', async () => {
    const host = await createUser('host');
    const response = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${host.token}`)
      .attach('image', Buffer.concat([PNG_SIGNATURE, Buffer.alloc(8)]), {
        filename: 'photo.png',
        contentType: 'image/png',
      });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatch(/^\/uploads\/image-[\w-]+\.png$/);

    const storedPath = path.join(UPLOADS_DIR, path.basename(response.body.data));
    expect(fs.existsSync(storedPath)).toBe(true);
    fs.unlinkSync(storedPath);
  });

  it('rejects a spoofed extension and removes the rejected file', async () => {
    const host = await createUser('host');
    const before = uploadedFiles();

    const response = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${host.token}`)
      .attach('image', Buffer.from('this is definitely not an image'), {
        filename: 'payload.png',
        contentType: 'image/png',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/not a valid image/i);

    const after = uploadedFiles();
    expect([...after].filter((name) => !before.has(name))).toHaveLength(0);
  });

  it('rejects unsupported file types before writing', async () => {
    const host = await createUser('host');
    const response = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${host.token}`)
      .attach('image', Buffer.from('<svg></svg>'), {
        filename: 'vector.svg',
        contentType: 'image/svg+xml',
      });

    expect(response.status).toBe(400);
  });
});

describe('GET /api/health', () => {
  it('reports the service and database as operational', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: 'operational',
      database: 'connected',
      service: 'Backroom Housing API',
    });
  });
});

describe('security headers', () => {
  it('sets hardening headers and hides the framework name', async () => {
    const response = await request(app).get('/api/health');

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(response.headers['x-powered-by']).toBeUndefined();
  });
});

describe('request body limits', () => {
  it('rejects an oversized JSON payload with 413', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ email: 'a@b.test', password: 'x'.repeat(200_000) }));

    expect(response.status).toBe(413);
    expect(response.body.error).toMatch(/too large/i);
  });

  it('rejects malformed JSON with 400', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email":');

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/valid JSON/i);
  });
});

describe('unknown routes', () => {
  it('returns a JSON 404 instead of HTML', async () => {
    const response = await request(app).get('/api/does-not-exist');
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });
});
