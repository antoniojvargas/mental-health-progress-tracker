import { Router } from 'express';
import { dailyLogController } from './daily-log.controller.js';
import { requireAuth } from '../auth/require-auth.middleware.js';
import { asyncHandler } from '../../core/http/async-handler.js';
import { validate } from '../../core/http/validate.js';
import { writeRateLimiter } from '../../core/http/rate-limit.js';
import { createDailyLogSchema, listDailyLogsQuerySchema } from './daily-log.schema.js';

export const dailyLogRoutes = Router();

dailyLogRoutes.use(requireAuth);
dailyLogRoutes.post(
  '/',
  writeRateLimiter,
  validate(createDailyLogSchema, 'body'),
  asyncHandler(dailyLogController.create),
);
dailyLogRoutes.get('/', validate(listDailyLogsQuerySchema, 'query'), asyncHandler(dailyLogController.list));
dailyLogRoutes.get('/today', asyncHandler(dailyLogController.today));
