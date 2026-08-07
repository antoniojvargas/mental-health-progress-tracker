import { Router } from 'express';
import { authController } from './auth.controller.js';
import { requireAuth } from './require-auth.middleware.js';
import { asyncHandler } from '../../core/http/async-handler.js';
import { authRateLimiter } from '../../core/http/rate-limit.js';

export const authRoutes = Router();

authRoutes.get('/google', authRateLimiter, authController.redirectToGoogle);
authRoutes.get('/google/callback', authRateLimiter, asyncHandler(authController.handleGoogleCallback));
authRoutes.get('/me', requireAuth, asyncHandler(authController.me));
authRoutes.post('/logout', authController.logout);
