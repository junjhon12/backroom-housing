import { connectDB } from './config/db';
import { assertServerEnv } from './config/env';
import app from './app';

const PORT = process.env.PORT || 5000;

const start = async (): Promise<void> => {
  assertServerEnv();

  // Wait for the connection before accepting traffic so requests can't arrive
  // while Mongoose is still buffering commands.
  await connectDB();

  app.listen(PORT, () => {
    console.log(`[Server] Backend listening on port ${PORT}`);
  });
};

start().catch((error) => {
  console.error('[Server] Failed to start:', error instanceof Error ? error.message : error);
  process.exit(1);
});
