import { NextFunction, Request, RequestHandler, Response } from 'express';

type AsyncRoute<T> = (req: Request, res: Response<T>, next: NextFunction) => Promise<unknown>;

/**
 * Express 4 does not forward rejected promises to the error middleware, so an
 * unhandled throw inside an async controller would leave the request hanging.
 * This wrapper funnels every rejection into `next(err)`.
 */
export const asyncHandler = <T>(handler: AsyncRoute<T>): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};
