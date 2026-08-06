import jwt from 'jsonwebtoken';
import { env } from '../../core/config/env.js';

export interface JwtPayload {
  sub: string;
  email: string;
}

const EXPIRES_IN_SECONDS = 60 * 60 * 24 * 7; // 7 days
export const SESSION_COOKIE_NAME = 'access_token';
export const SESSION_COOKIE_MAX_AGE_MS = EXPIRES_IN_SECONDS * 1000;

export const jwtService = {
  sign(payload: JwtPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: EXPIRES_IN_SECONDS });
  },

  verify(token: string): JwtPayload | null {
    try {
      return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    } catch {
      return null;
    }
  },
};
