import type { Request, Response } from 'express';
import { dailyLogService } from './daily-log.service.js';
import { UnauthorizedError } from '../../core/errors/app-error.js';
import type { CreateDailyLogInput, ListDailyLogsQuery } from './daily-log.schema.js';

export const dailyLogController = {
  async create(req: Request, res: Response): Promise<void> {
    if (!req.user) throw new UnauthorizedError();
    const input = req.body as CreateDailyLogInput;
    const { dto, created } = await dailyLogService.upsertLog(req.user.id, input);
    res.status(created ? 201 : 200).json(dto);
  },

  async list(req: Request, res: Response): Promise<void> {
    if (!req.user) throw new UnauthorizedError();
    const query = req.query as ListDailyLogsQuery;
    const result = await dailyLogService.listLogs(req.user.id, query);
    res.status(200).json(result);
  },

  async today(req: Request, res: Response): Promise<void> {
    if (!req.user) throw new UnauthorizedError();
    const log = await dailyLogService.getToday(req.user.id);
    res.status(200).json(log);
  },
};
