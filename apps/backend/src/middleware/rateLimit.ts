import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { Request, Response } from 'express';

// ─── Helper ───────────────────────────────────────────────────────────────────

const makeRateLimiter = (
  windowMs: number,
  max: number,
  message: string,
  code: string,
): RateLimitRequestHandler =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message, code },
    handler: (_req: Request, res: Response) => {
      res.status(429).json({ success: false, message, code });
    },
    skip: (req: Request) =>
      process.env.NODE_ENV === 'test' ||
      req.ip === '127.0.0.1' ||
      req.ip === '::1',
  });

// ─── General API ─────────────────────────────────────────────────────────────

export const apiLimiter = makeRateLimiter(
  60 * 1000,        // 1 minute
  100,
  'Too many requests. Please slow down.',
  'RATE_LIMIT_EXCEEDED',
);

// ─── Auth (strict) ────────────────────────────────────────────────────────────

export const authLimiter = makeRateLimiter(
  15 * 60 * 1000,   // 15 minutes
  5,
  'Too many authentication attempts. Please try again in 15 minutes.',
  'AUTH_RATE_LIMIT_EXCEEDED',
);

// ─── AI endpoints ─────────────────────────────────────────────────────────────

export const aiLimiter = makeRateLimiter(
  60 * 1000,        // 1 minute
  20,
  'AI rate limit exceeded. Max 20 requests per minute.',
  'AI_RATE_LIMIT_EXCEEDED',
);

// ─── Upload ───────────────────────────────────────────────────────────────────

export const uploadLimiter = makeRateLimiter(
  60 * 1000,        // 1 minute
  10,
  'Upload rate limit exceeded. Max 10 uploads per minute.',
  'UPLOAD_RATE_LIMIT_EXCEEDED',
);

// ─── Login lockout (Redis-backed, 5 failures → 15 min lockout) ───────────────

import { redis } from '../config/redis';
import { AppError } from './error';

const LOGIN_ATTEMPT_KEY = (ip: string) => `login_attempts:${ip}`;
const LOGIN_LOCKOUT_KEY = (ip: string) => `login_lockout:${ip}`;
const MAX_ATTEMPTS = 5;
const LOCKOUT_SECS = 15 * 60;

export const loginLockout = async (
  req: Request,
  _res: Response,
  next: (err?: unknown) => void,
): Promise<void> => {
  const ip = req.ip ?? 'unknown';
  const lockoutKey = LOGIN_LOCKOUT_KEY(ip);

  const isLocked = await redis.exists(lockoutKey);
  if (isLocked) {
    const ttl = await redis.ttl(lockoutKey);
    next(
      new AppError(
        `Too many failed login attempts. Try again in ${Math.ceil(ttl / 60)} minutes.`,
        429,
        true,
        'LOGIN_LOCKED',
      ),
    );
    return;
  }

  next();
};

export const recordFailedLogin = async (ip: string): Promise<void> => {
  const attemptsKey = LOGIN_ATTEMPT_KEY(ip);
  const attempts = await redis.incr(attemptsKey);
  await redis.expire(attemptsKey, LOCKOUT_SECS);

  if (attempts >= MAX_ATTEMPTS) {
    await redis.set(LOGIN_LOCKOUT_KEY(ip), '1', 'EX', LOCKOUT_SECS);
    await redis.del(attemptsKey);
  }
};

export const clearFailedLogins = async (ip: string): Promise<void> => {
  await redis.del(LOGIN_ATTEMPT_KEY(ip));
};
