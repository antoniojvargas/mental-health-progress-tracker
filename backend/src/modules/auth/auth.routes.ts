import { Router } from 'express';
import { authController } from './auth.controller.js';
import { requireAuth } from './require-auth.middleware.js';
import { asyncHandler } from '../../core/http/async-handler.js';

export const authRoutes = Router();

authRoutes.get('/google', authController.redirectToGoogle);
authRoutes.get('/google/callback', asyncHandler(authController.handleGoogleCallback));
authRoutes.get('/me', requireAuth, asyncHandler(authController.me));
authRoutes.post('/logout', authController.logout);
