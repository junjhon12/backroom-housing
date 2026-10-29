import { Request } from 'express';
import { IUser } from '../models/User';
import { AppError } from './AppError';

/**
 * Narrow `req.user` for handlers mounted behind `protect`, so controllers don't
 * need non-null assertions on a property the middleware already guarantees.
 */
export const requireUser = (req: Request): IUser => {
  if (!req.user) {
    throw new AppError(401, 'Not authorized');
  }
  return req.user;
};
