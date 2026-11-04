import { defineConfig, devices } from '@playwright/test';

const isCI = Boolean(process.env.CI);

// A dedicated database keeps the E2E run away from development data and from
// the Vitest suites, which own `backroom_housing_test`.
export const E2E_MONGO_URI =
  process.env.MONGO_URI_E2E ?? 'mongodb://127.0.0.1:27017/backroom_housing_e2e';

const BACKEND_PORT = 5000;
const FRONTEND_PORT = 5173;
const FRONTEND_URL = `http://localhost:${FRONTEND_PORT}`;

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',

  // The main-flow spec is one story told across several roles and shares one
  // database, so tests run in order on a single worker.
  fullyParallel: false,
  workers: 1,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  timeout: 30_000,
  expect: { timeout: 7_500 },

  reporter: isCI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: FRONTEND_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  // Starts the real API and the real SPA. The Vite dev server proxies /api and
  // /uploads to port 5000 (see apps/frontend/vite.config.ts), so the browser
  // sees one origin exactly as it does behind Vercel in production.
  //
  // reuseExistingServer is off on purpose: a `npm run dev` left running would
  // point at the development database and make these tests fail confusingly.
  webServer: [
    {
      command: 'npx tsx src/server.ts',
      cwd: 'apps/backend',
      url: `http://localhost:${BACKEND_PORT}/api/health`,
      reuseExistingServer: false,
      timeout: 60_000,
      env: {
        // NODE_ENV=test lifts the rate limiters, which would otherwise start
        // rejecting the auth calls after a few local re-runs.
        NODE_ENV: 'test',
        PORT: String(BACKEND_PORT),
        MONGO_URI: E2E_MONGO_URI,
        JWT_SECRET: process.env.JWT_SECRET ?? 'e2e-only-secret',
        FRONTEND_URL,
      },
    },
    {
      command: `npm run dev -w @backroom-housing/frontend -- --port ${FRONTEND_PORT} --strictPort`,
      url: FRONTEND_URL,
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
