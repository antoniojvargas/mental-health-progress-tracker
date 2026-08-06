import 'reflect-metadata';
import express, { type Express } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { pinoHttp } from 'pino-http';
import { env } from './core/config/env.js';
import { errorHandler } from './core/errors/error-handler.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { dailyLogRoutes } from './modules/daily-log/daily-log.routes.js';

export function createApp(): Express {
  const app = express();

  app.use(pinoHttp({ level: env.NODE_ENV === 'test' ? 'silent' : 'info' }));
  app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/logs', dailyLogRoutes);

  app.use(errorHandler);

  return app;
}
