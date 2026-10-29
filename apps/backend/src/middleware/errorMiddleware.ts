import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import { AppError } from '../utils/AppError';
import { MAX_IMAGE_BYTES } from './uploadMiddleware';

interface ErrorBody {
  success: false;
  error: string;
}

const isDuplicateKeyError = (error: unknown): error is { keyPattern?: Record<string, unknown> } =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  (error as { code?: unknown }).code === 11000;

const maxMegabytes = Math.round(MAX_IMAGE_BYTES / (1024 * 1024));

/**
 * Any request that reached the end of the router chain without a handler is an
 * unknown API route. Returning JSON here keeps the error contract consistent —
 * Express's default HTML 404 makes `response.json()` throw on the client.
 */
export const notFound = (req: Request, _res: Response, next: NextFunction): void => {
  next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response<ErrorBody>,
  next: NextFunction
): void => {
  // If the response already started streaming, the only safe move is to bail out.
  if (res.headersSent) {
    next(err);
    return;
  }

  let statusCode = 500;
  let message = 'Internal Server Error';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((validationError) => validationError.message)
      .join(', ');
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid value for ${err.path}`;
  } else if (err instanceof multer.MulterError) {
    statusCode = 400;
    message =
      err.code === 'LIMIT_FILE_SIZE'
        ? `Image must be ${maxMegabytes}MB or smaller`
        : err.message;
  } else if (isDuplicateKeyError(err)) {
    statusCode = 409;
    message =
      'email' in (err.keyPattern ?? {})
        ? 'An account with that email already exists'
        : 'A record with that value already exists';
  }

  // Client mistakes are expected; server faults are not and need the detail.
  if (statusCode >= 500) {
    console.error('[Error]', err);
  }

  res.status(statusCode).json({ success: false, error: message });
};
