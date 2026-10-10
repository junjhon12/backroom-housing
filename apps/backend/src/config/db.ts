import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI as string);
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