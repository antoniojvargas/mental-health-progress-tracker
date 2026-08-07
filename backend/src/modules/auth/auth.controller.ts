import type { Request, Response } from 'express';
import { authService } from './auth.service.js';
import { jwtService, SESSION_COOKIE_NAME, SESSION_COOKIE_MAX_AGE_MS } from './jwt.service.js';
import { userRepository } from '../user/user.repository.js';
import { UnauthorizedError, ValidationError } from '../../core/errors/app-error.js';
import { env, isProduction } from '../../core/config/env.js';
import { getCookie } from '../../core/http/get-cookie.js';

const STATE_COOKIE_NAME = 'oauth_state';
const STATE_COOKIE_MAX_AGE_MS = 10 * 60 * 1000;

const cookieBaseOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax' as const,
  path: '/',
};

export const authController = {
  redirectToGoogle: (req: Request, res: Response): void => {
    const state = authService.generateState();
    res.cookie(STATE_COOKIE_NAME, state, {
      ...cookieBaseOptions,
      maxAge: STATE_COOKIE_MAX_AGE_MS,
    });
    res.redirect(authService.buildGoogleAuthUrl(state));
  },

  handleGoogleCallback: async (req: Request, res: Response): Promise<void> => {
    const { code, state } = req.query;
    const expectedState = getCookie(req, STATE_COOKIE_NAME);
    res.clearCookie(STATE_COOKIE_NAME, { path: '/' });

    if (typeof code !== 'string' || typeof state !== 'string' || state !== expectedState) {
      res.redirect(`${env.FRONTEND_URL}/login?error=auth_failed`);
      return;
    }

    try {
      const { token } = await authService.completeGoogleLogin(code);
      res.cookie(SESSION_COOKIE_NAME, token, {
        ...cookieBaseOptions,
        maxAge: SESSION_COOKIE_MAX_AGE_MS,
      });
      res.redirect(`${env.FRONTEND_URL}/dashboard`);
    } catch (err) {
      req.log?.error({ err }, 'Google OAuth callback failed');
      res.redirect(`${env.FRONTEND_URL}/login?error=auth_failed`);
    }
  },

  me: async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const user = await userRepository.findById(req.user.id);
    if (!user) {
      throw new UnauthorizedError();
    }
    res.status(200).json({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    });
  },

  logout: (_req: Request, res: Response): void => {
    res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
    res.status(204).send();
  },

  /**
   * E2E-only stand-in for the real Google OAuth handshake — Playwright can't script Google's
   * consent screen (and shouldn't try to), and the token exchange it replaces is a
   * server-to-server call this backend makes directly, which browser-level network mocking
   * can't intercept either. Only registered when NODE_ENV==='test' (see auth.routes.ts) —
   * doesn't exist as a route at all otherwise. Issues the exact same session cookie the real
   * callback does, via the same jwtService, so everything downstream is exercised for real.
   */
  testLogin: async (req: Request, res: Response): Promise<void> => {
    const { email, name } = req.body as { email?: string; name?: string };
    if (!email) {
      throw new ValidationError('email is required');
    }

    const user = await userRepository.upsertByGoogleId({
      googleId: `e2e-${email}`,
      email,
      name: name ?? email,
      avatarUrl: null,
    });
    const token = jwtService.sign({ sub: user.id, email: user.email });
    res.cookie(SESSION_COOKIE_NAME, token, { ...cookieBaseOptions, maxAge: SESSION_COOKIE_MAX_AGE_MS });
    res.status(200).json({ id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl });
  },
};
