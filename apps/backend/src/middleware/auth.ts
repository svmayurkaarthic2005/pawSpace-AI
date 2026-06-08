import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from './error';

export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

// Extend Express Request to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401, true, 'NO_TOKEN');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new AppError('No token provided', 401, true, 'NO_TOKEN');
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      req.user = decoded;
      console.log('[Auth Middleware] Token verified successfully:', { userId: decoded.userId, email: decoded.email });
      next();
    } catch (jwtError: any) {
      console.error('[Auth Middleware] JWT verification failed:', {
        error: jwtError.message,
        name: jwtError.name,
        token: token.substring(0, 20) + '...',
      });
      throw new AppError('Invalid or expired token', 401, true, 'INVALID_TOKEN');
    }
  } catch (err) {
    next(err);
  }
};

export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) {
        const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
        req.user = decoded;
      }
    }
    next();
  } catch (_err) {
    // Silently ignore invalid tokens for optional auth
    next();
  }
};
