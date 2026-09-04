import { Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse';

export function notFound(req: Request, res: Response): void {
  ApiResponse.error({
    res,
    statusCode: 404,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
}
