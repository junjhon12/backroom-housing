import { execSync } from 'node:child_process';
import { E2E_MONGO_URI } from '../playwright.config';

// Recreates the seeded listings and demo accounts before every run, so the
// suite starts from the same registry regardless of what earlier runs left.
export default function globalSetup(): void {
  execSync('npm run seed -w @backroom-housing/backend', {
    stdio: 'inherit',
    env: {
      ...process.env,
      MONGO_URI: E2E_MONGO_URI,
      JWT_SECRET: process.env.JWT_SECRET ?? 'e2e-only-secret',
    },
  });
}
