import { Response } from 'express';

interface SuccessOptions<T> {
  res: Response;
  statusCode?: number;
  message: string;
  data?: T;
  meta?: Record<string, unknown>;
}

interface ErrorOptions {
  res: Response;
  statusCode?: number;
  message: string;
  errors?: Array<{ field?: string; message: string }>;
}

export class ApiResponse {
  static success<T>({ res, statusCode = 200, message, data, meta }: SuccessOptions<T>): Response {
    return res.status(statusCode).json({
      success: true,
      message,
      data: data ?? null,
      ...(meta && { meta }),
    });
  }

  static error({ res, statusCode = 500, message, errors }: ErrorOptions): Response {
    return res.status(statusCode).json({
      success: false,
      message,
      ...(errors && { errors }),
    });
  }
}
