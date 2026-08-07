import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { pinoHttp } from 'pino-http';
import { env } from './core/config/env.js';
import { logger } from './core/logging/logger.js';
import { AppDataSource } from './core/database/data-source.js';
import { errorHandler } from './core/errors/error-handler.js';
import { asyncHandler } from './core/http/async-handler.js';
import { buildOpenApiDocument } from './core/http/openapi.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { dailyLogRoutes } from './modules/daily-log/daily-log.routes.js';

export function createApp(): Express {
  const app = express();

  app.use(
    pinoHttp({
      logger,
      // Correlate every log line for a request, including ones logged deep in a service —
      // echoed back to the client so a bug report's "X-Request-Id" can be grepped straight
      // out of the logs.
      genReqId: (req, res) => {
        const existing = req.headers['x-request-id'];
        const id = typeof existing === 'string' ? existing : randomUUID();
        res.setHeader('X-Request-Id', id);
        return id;
      },
      // Never log the session cookie or an Authorization header, even at debug level.
      redact: {
        paths: ['req.headers.cookie', 'req.headers.authorization', 'res.headers["set-cookie"]'],
        remove: true,
      },
    }),
  );
  // Applies everywhere except /api/docs below, which needs its CSP relaxed for Swagger UI's
  // inline scripts — the rest of the API only ever returns JSON (or a bare OAuth redirect), so
  // Helmet's strict default policy applies cleanly there with no loosening needed.
  app.use(helmet());
  app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  const openApiDocument = buildOpenApiDocument();
  app.use(
    '/api/docs',
    (_req: Request, res: Response, next: NextFunction) => {
      res.removeHeader('Content-Security-Policy');
      next();
    },
    swaggerUi.serve,
    swaggerUi.setup(openApiDocument),
  );

  app.get(
    '/api/health',
    asyncHandler(async (_req, res) => {
      try {
        await AppDataSource.query('SELECT 1');
        res.status(200).json({ status: 'ok', uptime: process.uptime() });
      } catch (err) {
        logger.error({ err }, 'Health check failed: database unreachable');
        res.status(503).json({ status: 'error', db: 'unreachable' });
      }
    }),
  );

  app.use('/api/auth', authRoutes);
  app.use('/api/logs', dailyLogRoutes);

  app.use(errorHandler);

  return app;
}
