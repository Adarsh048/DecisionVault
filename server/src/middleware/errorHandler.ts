import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';
import { ApiResponse } from '../utils/ApiResponse';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  logger.error(err.message, {
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
    name: err.name,
  });

  if (err instanceof ZodError) {
    ApiResponse.error({
      res,
      statusCode: 400,
      message: 'Validation failed',
      errors: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  if (err instanceof AppError && err.isOperational) {
    ApiResponse.error({
      res,
      statusCode: err.statusCode,
      message: err.message,
      errors: err.errors,
    });
    return;
  }

  // Mongoose duplicate key
  const mongoErr = err as unknown as { name: string; code: number };
  if (mongoErr.name === 'MongoServerError' && mongoErr.code === 11000) {
    ApiResponse.error({ res, statusCode: 409, message: 'A record with this value already exists' });
    return;
  }

  ApiResponse.error({
    res,
    statusCode: 500,
    message: env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
}
