import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app';
import Property, { type HazardClass } from '../models/Property';
import User from '../models/User';

export const connectTestDB = async (): Promise<void> => {
  const uri = process.env.MONGO_URI_TEST;
  if (!uri) {
    throw new Error('MONGO_URI_TEST is not set');
  }
  await mongoose.connect(uri);
  // `$text` queries fail until the schema's text index exists.
  await Property.init();
};

export const disconnectTestDB = async (): Promise<void> => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
};

export const clearTestDB = async (): Promise<void> => {
  await Promise.all([User.deleteMany({}), Property.deleteMany({})]);
};

interface TestUser {
  id: string;
  token: string;
}

export const createUser = async (
  role: 'renter' | 'host' | 'admin' = 'renter',
  email = `${role}@backroom.test`
): Promise<TestUser> => {
  const user = await User.create({
    name: `Test ${role}`,
    email,
    password: 'password123',
    role,
  });

  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'password123' });

  return { id: user.id, token: response.body.data.token as string };
};

interface PropertyOverrides {
  title?: string;
  description?: string;
  price?: number;
  level?: string;
  sector?: string;
  hazardClass?: HazardClass;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  isAvailable?: boolean;
  images?: string[];
}

export const createProperty = async (
  host: string,
  overrides: PropertyOverrides = {}
): Promise<InstanceType<typeof Property>> =>
  Property.create({
    title: 'The Lobby, Reclaimed',
    description: 'Damp carpet, steady fluorescent hum, no windows.',
    price: 1450,
    level: 'Level 0',
    sector: 'Sector B-12',
    hazardClass: 'safe',
    bedrooms: 1,
    bathrooms: 1,
    squareFeet: 620,
    images: [],
    host,
    ...overrides,
  });

export { app };
