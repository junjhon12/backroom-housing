import { connectDB } from './config/db';
import app from './app';

const PORT = process.env.PORT || 5000;

const start = async (): Promise<void> => {
  // Wait for the connection before accepting traffic so requests can't arrive
  // while Mongoose is still buffering commands.
  await connectDB();

  app.listen(PORT, () => {
    console.log(`[Server] Backend listening on port ${PORT}`);
  });
};

start().catch((error) => {
  console.error('[Server] Failed to start:', error);
  process.exit(1);
});
