const REQUIRED_SERVER_ENV = ['MONGO_URI', 'JWT_SECRET'] as const;

/**
 * Fail at boot rather than on the first login attempt. The seed and test
 * scripts import pieces of the app without starting the server, so validation
 * lives here instead of at module load.
 */
export const assertServerEnv = (): void => {
  const missing = REQUIRED_SERVER_ENV.filter((key) => !process.env[key]?.trim());

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}. ` +
        'Copy apps/backend/.env.example to apps/backend/.env and fill it in.'
    );
  }

  if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET!.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters in production.');
  }
};
