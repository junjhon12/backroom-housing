import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Property from '../models/Property';

// Same .env resolution as the seed script.
dotenv.config({ path: __dirname + '/../../.env' });

/**
 * `syncIndexes` drops indexes that are no longer in the schema and builds the
 * ones that are. Run this after changing a schema index — in particular the
 * text index, since MongoDB permits only one per collection and will not
 * replace it automatically.
 */
const run = async (): Promise<void> => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable is missing.');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('[Indexes] Database connected successfully.');

    const dropped = await Property.syncIndexes();
    console.log(`[Indexes] Properties synchronized. Dropped: ${dropped.join(', ') || 'none'}`);

    process.exit(0);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`[Indexes Error]: ${error.message}`);
    } else {
      console.error('[Indexes Error]: An unknown error occurred.');
    }
    process.exit(1);
  }
};

run();
