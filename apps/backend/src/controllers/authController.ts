import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import type { ApiResponse } from '../types/api';

interface AuthPayload {
  _id: string;
  name: string;
  email: string;
  role: string;
  token: string;
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

export const registerUser = asyncHandler(
  async (req: Request, res: Response<ApiResponse<AuthPayload>>): Promise<void> => {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const email = normalizeEmail(req.body.email);
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!name || !email || !password) {
      throw new AppError(400, 'Name, email and password are required');
    }

    if (!EMAIL_PATTERN.test(email)) {
      throw new AppError(400, 'Please provide a valid email address');
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new AppError(400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      throw new AppError(409, 'An account with that email already exists');
    }

    // Public registration may only create renters. Privileged roles are granted
    // out-of-band, so a crafted request body cannot mint a host or admin account.
    // A concurrent duplicate request is caught by the unique index and mapped
    // to a 409 by the central error handler.
    const user = await User.create({
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
  }
);

export const loginUser = asyncHandler(
  async (req: Request, res: Response<ApiResponse<AuthPayload>>): Promise<void> => {
    const email = normalizeEmail(req.body.email);
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!email || !password) {
      throw new AppError(400, 'Email and password are required');
    }

    const user = await User.findOne({ email });

    if (!user || !(await user.matchPassword(password))) {
      throw new AppError(401, 'Invalid email or password');
    }

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
  }
);
