import { afterEach, describe, expect, it } from 'vitest';
import { assertServerEnv } from './env';

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('assertServerEnv', () => {
  it('accepts a complete environment', () => {
    process.env.MONGO_URI = 'mongodb://localhost/test';
    process.env.JWT_SECRET = 'a-development-secret';
    delete process.env.NODE_ENV;

    expect(() => assertServerEnv()).not.toThrow();
  });

  it('lists every missing variable', () => {
    delete process.env.MONGO_URI;
    delete process.env.JWT_SECRET;

    expect(() => assertServerEnv()).toThrow(/MONGO_URI, JWT_SECRET/);
  });

  it('enforces a strong secret in production', () => {
    process.env.MONGO_URI = 'mongodb://localhost/test';
    process.env.JWT_SECRET = 'short';
    process.env.NODE_ENV = 'production';

    expect(() => assertServerEnv()).toThrow(/at least 32 characters/i);
  });
});
