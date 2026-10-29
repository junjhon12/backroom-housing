import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Property from '../models/Property';
import User from '../models/User';

// Explicitly define path to .env since this script runs outside the standard server context
dotenv.config({ path: __dirname + '/../../.env' });

// Listings require a host, so the seed needs a user to own them. Created through
// the model (not an upsert) so the password hashing hook runs.
const SEED_HOST = {
  name: 'Backroom Demo Host',
  email: 'host@backroom.local',
  password: 'password123',
  role: 'host' as const,
};

const seedProperties = [
  {
    title: 'Modern Downtown Loft',
    description: 'A spacious, open-concept loft in the heart of the tech district. Features exposed brick walls, high ceilings, and smart home integration.',
    price: 2400,
    location: 'Downtown Tech District',
    bedrooms: 1,
    bathrooms: 1,
    squareFeet: 950,
    isAvailable: true,
  },
  {
    title: 'Suburban Tech Retreat',
    description: 'Quiet 3-bedroom home perfect for remote workers. Includes a dedicated office space, fiber optic internet readiness, and a large backyard.',
    price: 3200,
    location: 'Silicon Suburbs',
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1800,
    isAvailable: true,
  },
  {
    title: 'Minimalist Studio Micro-Apartment',
    description: 'Highly optimized living space for the minimalist. Built-in foldaway furniture, central location, and access to a shared coworking lounge.',
    price: 1500,
    location: 'Innovation Hub',
    bedrooms: 0,
    bathrooms: 1,
    squareFeet: 400,
    isAvailable: true,
  }
];

const runSeed = async (): Promise<void> => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable is missing.');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('[Seed] Database connected successfully.');

    let host = await User.findOne({ email: SEED_HOST.email });
    if (!host) {
      host = await User.create(SEED_HOST);
      console.log(`[Seed] Demo host created: ${host.email}`);
    } else {
      console.log(`[Seed] Reusing demo host: ${host.email}`);
    }

    // Idempotent operation: Clear existing data before inserting
    await Property.deleteMany({});
    console.log('[Seed] Existing properties cleared.');

    // Saved listings still point at the documents we just removed; reset them
    // so nobody is left with dangling references.
    await User.updateMany({}, { $set: { savedProperties: [] } });
    console.log('[Seed] Saved listings reset.');

    // Insert mock data, owned by the demo host
    await Property.insertMany(seedProperties.map((property) => ({ ...property, host: host._id })));
    console.log('[Seed] Mock properties inserted successfully.');

    process.exit(0);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`[Seed Error]: ${error.message}`);
    } else {
      console.error('[Seed Error]: An unknown error occurred.');
    }
    process.exit(1);
  }
};

runSeed();
