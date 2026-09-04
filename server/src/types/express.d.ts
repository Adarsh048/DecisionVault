import 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
      orgMembership?: {
        orgId: string;
        role: string;
      };
    }
  }
}

export {};
