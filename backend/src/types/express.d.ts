import { JWTPayload } from '../utils/jwt';

// Extend Express Request interface to include user information
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export {};
