import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from './error';

type ValidationTarget = 'body' | 'query' | 'params';

export const validate =
  (schema: ZodSchema, target: ValidationTarget = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const data = schema.parse(req[target]);
      // Replace with parsed/coerced data
      req[target] = data;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const messages = err.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        }));
        next(
          new AppError(
            `Validation failed: ${messages.map((m) => `${m.field} - ${m.message}`).join(', ')}`,
            422,
            true,
            'VALIDATION_ERROR',
          ),
        );
      } else {
        next(err);
      }
    }
  };
