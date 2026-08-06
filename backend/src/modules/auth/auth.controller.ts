import type { Request, Response } from 'express';
import { authService } from './auth.service.js';
import { jwtService, SESSION_COOKIE_NAME, SESSION_COOKIE_MAX_AGE_MS } from './jwt.service.js';
import { userRepository } from '../user/user.repository.js';
import { UnauthorizedError } from '../../core/errors/app-error.js';
import { env, isProduction } from '../../core/config/env.js';

const STATE_COOKIE_NAME = 'oauth_state';
const STATE_COOKIE_MAX_AGE_MS = 10 * 60 * 1000;

const cookieBaseOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax' as const,
  path: '/',
};

export const authController = {
  redirectToGoogle(req: Request, res: Response): void {
    const state = authService.generateState();
    res.cookie(STATE_COOKIE_NAME, state, {
      ...cookieBaseOptions,
      maxAge: STATE_COOKIE_MAX_AGE_MS,
    });
    res.redirect(authService.buildGoogleAuthUrl(state));
  },

  async handleGoogleCallback(req: Request, res: Response): Promise<void> {
    const { code, state } = req.query;
    const expectedState = req.cookies?.[STATE_COOKIE_NAME];
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

  async me(req: Request, res: Response): Promise<void> {
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

  logout(_req: Request, res: Response): void {
    res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
    res.status(204).send();
  },
};
