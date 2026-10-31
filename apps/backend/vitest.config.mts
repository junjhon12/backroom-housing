import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // The integration suites share one MongoDB database, so running files in
    // parallel would let them clear each other's collections mid-test.
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'test-only-secret',
      FRONTEND_URL: 'http://localhost:5173',
      MONGO_URI_TEST:
        process.env.MONGO_URI_TEST ?? 'mongodb://127.0.0.1:27017/backroom_housing_test',
    },
    testTimeout: 15000,
    hookTimeout: 20000,
  },
});
