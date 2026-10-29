import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error('[Database Error]: MONGO_URI is not set. Copy .env.example to .env.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(mongoUri);
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`[Database Error]: ${error.message}`);
    } else {
      console.error(`[Database Error]: An unknown error occurred`);
    }
    // Exit process with failure code if the database cannot connect
    process.exit(1);
  }
};
