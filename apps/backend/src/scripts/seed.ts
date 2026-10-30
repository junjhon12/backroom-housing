import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Property from '../models/Property';
import User from '../models/User';

// Explicitly define path to .env since this script runs outside the standard server context
dotenv.config({ path: __dirname + '/../../.env' });

// Listings require a host, so the seed needs a user to own them. Created through
// the model (not an upsert) so the password hashing hook runs.
const SEED_HOST = {
  name: 'Registry Demo Host',
  email: 'host@backroom.local',
  password: 'password123',
  role: 'host' as const,
};

const seedProperties = [
  {
    title: 'The Lobby, Reclaimed',
    description:
      'One of the quieter stretches of Level 0. Damp carpet, steady fluorescent hum, no windows. The previous occupant left in a hurry; their furniture is included and has not been moved since.',
    price: 1450,
    level: 'Level 0',
    sector: 'Sector B-12',
    hazardClass: 'safe' as const,
    bedrooms: 1,
    bathrooms: 1,
    squareFeet: 620,
    isAvailable: true,
  },
  {
    title: 'Habitable Zone Quarters',
    description:
      'Proper walls, working lights, and a supply drop every eleven days. Foot traffic from Level 0 is audible through the floor at all hours. Bring your own bedding; the Registry does not issue it.',
    price: 2100,
    level: 'Level 1',
    sector: 'Sector A-3',
    hazardClass: 'safe' as const,
    bedrooms: 2,
    bathrooms: 1,
    squareFeet: 900,
    isAvailable: true,
  },
  {
    title: 'Abandoned Office Suite',
    description:
      'Open-plan office with forty identical desks, one of which is always warm. Utilities are unreliable after 02:00. Do not move the desks. The lease is month to month and cannot be terminated early.',
    price: 980,
    level: 'Level 4',
    sector: 'Sector C-7',
    hazardClass: 'caution' as const,
    bedrooms: 0,
    bathrooms: 1,
    squareFeet: 480,
    isAvailable: true,
  },
  {
    title: 'Unnumbered Hotel Suite',
    description:
      'A suite on a floor that does not appear in the hotel directory. Room service is prompt and no one has ever seen the staff. Corridors are longer at night than they are during the day.',
    price: 3200,
    level: 'Level 5',
    sector: 'Sector 5-2',
    hazardClass: 'caution' as const,
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1400,
    isAvailable: true,
  },
  {
    title: 'Poolrooms, Semi-Dry Unit',
    description:
      'Warm shallow water throughout the level; the unit itself stays dry, though the corridor does not. Tiles are original. Bring your own towels, and do not swim alone.',
    price: 1750,
    level: 'Level 37',
    sector: 'Sector 4',
    hazardClass: 'safe' as const,
    bedrooms: 1,
    bathrooms: 1,
    squareFeet: 700,
    isAvailable: true,
  },
  {
    title: 'Lights Out, Reinforced Unit',
    description:
      'Total darkness beyond the door. The unit has its own generator, a reinforced frame, and a supply hatch. Applicants must sign a waiver and register a next of kin before the file is released.',
    price: 640,
    level: 'Level 6',
    sector: 'Sector D-1',
    hazardClass: 'hostile' as const,
    bedrooms: 1,
    bathrooms: 1,
    squareFeet: 300,
    isAvailable: true,
  },
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
