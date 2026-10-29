import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

interface AuthResponse {
  success: boolean;
  data?: {
    _id: string;
    name: string;
    email: string;
    role: string;
    token: string;
  };
  error?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

const generateToken = (id: string): string => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// The schema lowercases emails before saving, so every lookup must normalize
// the same way or "John@Example.com" silently fails to match "john@example.com".
const normalizeEmail = (value: unknown): string =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  (error as { code?: unknown }).code === 11000;

export const registerUser = async (req: Request, res: Response<AuthResponse>): Promise<void> => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const email = normalizeEmail(req.body.email);
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!name || !email || !password) {
      res.status(400).json({ success: false, error: 'Name, email and password are required' });
      return;
    }

    if (!EMAIL_PATTERN.test(email)) {
      res.status(400).json({ success: false, error: 'Please provide a valid email address' });
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      res.status(400).json({
        success: false,
        error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      });
      return;
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(409).json({ success: false, error: 'An account with that email already exists' });
      return;
    }

    // Public registration may only create renters. Privileged roles are granted
    // out-of-band, so a crafted request body cannot mint a host or admin account.
    const user: IUser = await User.create({
      name,
      email,
      password,
      role: 'renter',
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user.id),
      },
    });
  } catch (error) {
    // A concurrent request can slip past the existence check above, in which
    // case the unique index is the source of truth.
    if (isDuplicateKeyError(error)) {
      res.status(409).json({ success: false, error: 'An account with that email already exists' });
      return;
    }

    // Never surface driver-level messages (index names, validation paths) to clients.
    console.error('[Auth] Registration failed:', error);
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
};

export const loginUser = async (req: Request, res: Response<AuthResponse>): Promise<void> => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.status(200).json({
        success: true,
        data: {
          _id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: generateToken(user.id),
        },
      });
    } else {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('[Auth] Login failed:', error);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
};
