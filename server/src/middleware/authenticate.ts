import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/tokenUtils';
import { UnauthorizedError } from '../utils/AppError';

export interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
  };
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('No access token provided');
    }
    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);
    (req as AuthenticatedRequest).user = { userId: payload.userId, email: payload.email };
    next();
  } catch (err) {
    next(err);
  }
}
