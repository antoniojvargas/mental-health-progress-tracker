import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../../core/errors/app-error.js';
import { jwtService, SESSION_COOKIE_NAME } from './jwt.service.js';

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  const payload = token ? jwtService.verify(token) : null;

  if (!payload) {
    next(new UnauthorizedError());
    return;
  }

  req.user = { id: payload.sub, email: payload.email };
  next();
}
