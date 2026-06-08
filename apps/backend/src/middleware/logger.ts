import morgan, { StreamOptions } from 'morgan';
import { Request, Response } from 'express';
import { env } from '../config/env';

// ─── Custom Token ─────────────────────────────────────────────────────────────

morgan.token('body', (req: Request) => {
  const body = { ...(req.body as Record<string, unknown>) };
  // Redact sensitive fields
  const sensitiveFields = ['password', 'token', 'secret', 'authorization'];
  sensitiveFields.forEach((field) => {
    if (body[field]) body[field] = '[REDACTED]';
  });
  return JSON.stringify(body);
});

morgan.token('user-id', (req: Request) => {
  return (req as Request & { user?: { userId: string } }).user?.userId ?? 'anonymous';
});

// ─── Stream ───────────────────────────────────────────────────────────────────

const stream: StreamOptions = {
  write: (message: string) => {
    // Strip trailing newline from morgan output
    console.log(message.trim());
  },
};

// ─── Format ───────────────────────────────────────────────────────────────────

const developmentFormat =
  ':method :url :status :response-time ms - :res[content-length] | user=:user-id';

const productionFormat =
  ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms';

// ─── Skip Healthcheck Logs ────────────────────────────────────────────────────

const skip = (_req: Request, res: Response): boolean => {
  if (env.NODE_ENV === 'production') {
    return res.statusCode < 400;
  }
  return false;
};

// ─── Export ───────────────────────────────────────────────────────────────────

export const httpLogger = morgan(
  env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
  { stream, skip: env.NODE_ENV === 'production' ? skip : undefined },
);
