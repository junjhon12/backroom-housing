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

// Utility to generate JWT
const generateToken = (id: string): string => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

export const registerUser = async (req: Request, res: Response<AuthResponse>): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400).json({ success: false, error: 'User already exists with this email' });
      return;
    }

    // Create user
    const user: IUser = await User.create({
      name,
      email,
      password,
      role: role || 'renter',
    });

    if (user) {
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
    } else {
      res.status(400).json({ success: false, error: 'Invalid user data received' });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Server encountered an error during registration';
    res.status(500).json({ success: false, error: errorMessage });
  }
};