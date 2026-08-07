import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { ValidationError } from '../errors/app-error.js';

type ValidateTarget = 'body' | 'query';

export function validate(schema: ZodSchema, target: ValidateTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      next(new ValidationError('Invalid request data', result.error.issues));
      return;
    }
    // Express types req.body/req.query as `any` — result.data is whatever shape the caller's
    // own schema validated it into, which is the whole point of a generic validate() middleware.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    req[target] = result.data;
    next();
  };
}
