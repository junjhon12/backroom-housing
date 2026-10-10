import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

interface JwtPayload {
  id: string;
}

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  let token: string | undefined;

  // Check for token in the Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract the token (Format: "Bearer <token>")
      token = req.headers.authorization.split(' ')[1];

      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is missing from environment variables');
      }

      // Cryptographically verify the token signature
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;

      // Fetch the user from the database (excluding the hashed password)
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        res.status(401).json({ success: false, error: 'Not authorized, user no longer exists' });
        return;
      }

      // Attach the user to the Express request object
      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ success: false, error: 'Not authorized, token failed or expired' });
    }
  } else {
    res.status(401).json({ success: false, error: 'Not authorized, no token provided' });
  }
};

// Closure to accept an array of permitted roles
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ 
        success: false, 
        error: `User role '${req.user?.role || 'unknown'}' is forbidden from accessing this route` 
      });
      return;
    }
    next();
  };
};