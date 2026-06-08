import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { env } from '../config/env';

// ─── AppError Class ───────────────────────────────────────────────────────────

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    code?: string,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;

    // Maintains proper stack trace in V8
    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// ─── Error Response Shape ─────────────────────────────────────────────────────

interface ErrorResponse {
  success: false;
  message: string;
  code?: string;
  errors?: unknown[];
  stack?: string;
}

// ─── Error Handlers ───────────────────────────────────────────────────────────

const handleZodError = (err: ZodError): AppError => {
  const message = (err as ZodError).issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
  return new AppError(message, 422, true, 'VALIDATION_ERROR');
};

const handleMongooseDuplicateKey = (err: mongoose.mongo.MongoServerError): AppError => {
  const field = Object.keys(err.keyValue ?? {})[0] ?? 'field';
  return new AppError(`Duplicate value for ${field}`, 409, true, 'DUPLICATE_KEY');
};

const handleMongooseCastError = (err: mongoose.Error.CastError): AppError => {
  return new AppError(`Invalid ${err.path}: ${err.value}`, 400, true, 'INVALID_ID');
};

const handleMongooseValidationError = (err: mongoose.Error.ValidationError): AppError => {
  const messages = Object.values(err.errors).map((e) => e.message);
  return new AppError(messages.join(', '), 422, true, 'VALIDATION_ERROR');
};

const handleJWTError = (): AppError =>
  new AppError('Invalid token. Please log in again.', 401, true, 'INVALID_TOKEN');

const handleJWTExpiredError = (): AppError =>
  new AppError('Your token has expired. Please log in again.', 401, true, 'TOKEN_EXPIRED');

// ─── Central Error Handler Middleware ─────────────────────────────────────────

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  let error: AppError;

  if (err instanceof AppError) {
    error = err;
  } else if (err instanceof ZodError) {
    error = handleZodError(err as ZodError);
  } else if (err instanceof mongoose.Error.CastError) {
    error = handleMongooseCastError(err);
  } else if (err instanceof mongoose.Error.ValidationError) {
    error = handleMongooseValidationError(err);
  } else if ((err as mongoose.mongo.MongoServerError).code === 11000) {
    error = handleMongooseDuplicateKey(err as mongoose.mongo.MongoServerError);
  } else if (err.name === 'JsonWebTokenError') {
    error = handleJWTError();
  } else if (err.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  } else {
    // Unknown / programmer errors
    console.error('💥 Unhandled error:', err);
    error = new AppError('Something went wrong', 500, false);
  }

  const response: ErrorResponse = {
    success: false,
    message: error.isOperational ? error.message : 'Internal server error',
    code: error.code,
  };

  if (env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(error.statusCode).json(response);
};

// ─── 404 Handler ─────────────────────────────────────────────────────────────

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404, true, 'NOT_FOUND'));
};
