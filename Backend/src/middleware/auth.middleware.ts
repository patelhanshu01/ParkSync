import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../config/jwt.config';
import { JwtPayload } from 'jsonwebtoken';

// Define custom JWT payload interface
export interface CustomJWTPayload extends JwtPayload {
  userId?: number;
  id?: string;
  email?: string;
  role?: string;
}

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: CustomJWTPayload;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const payload = verifyToken(token) as CustomJWTPayload;
    req.user = payload;

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const optionalAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = verifyToken(token) as CustomJWTPayload;
      req.user = payload;
    }

    next();
  } catch (error) {
    // If token is invalid, continue without user
    next();
  }
};

export const roleMiddleware = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!req.user.role || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};