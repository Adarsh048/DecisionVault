import rateLimit from 'express-rate-limit';
import { ApiResponse } from '../utils/ApiResponse';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

const isDev = env.NODE_ENV === 'development';

const createLimiter = (windowMs: number, max: number, message: string) => {
  if (isDev) {
    // Pass-through in development so HMR, React StrictMode, and testing are never throttled
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req: Request, res: Response) => {
      ApiResponse.error({ res, statusCode: 429, message });
    },
  });
};

// General API: 100 req / 15 min in production
export const generalLimiter = createLimiter(
  15 * 60 * 1000,
  100,
  'Too many requests. Please try again later.'
);

// Auth endpoints: 20 req / 15 min in production
export const authLimiter = createLimiter(
  15 * 60 * 1000,
  20,
  'Too many authentication attempts. Please try again in 15 minutes.'
);
