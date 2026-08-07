import { dailyLogRepository } from './daily-log.repository.js';
import { toDailyLogDto, type DailyLogDto } from './daily-log.mapper.js';
import type { CreateDailyLogInput } from './daily-log.schema.js';
import type { LogEventEmitter } from '../../realtime/log-events.js';

// Null object: swapped for the real Socket.IO-backed emitter by setLogEventEmitter() during
// server startup. Starting from a no-op instead of `null` means a request that somehow lands
// before that wiring runs just skips the emit silently instead of needing a null-check (or,
// worse, throwing) at every call site.
const noopEmitter: LogEventEmitter = {
  emitLogCreated: () => {},
  emitLogUpdated: () => {},
};

let logEventEmitter: LogEventEmitter = noopEmitter;

export function setLogEventEmitter(emitter: LogEventEmitter): void {
  logEventEmitter = emitter;
}

const DEFAULT_RANGE_DAYS = 30;

function defaultRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - DEFAULT_RANGE_DAYS);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

export const dailyLogService = {
  async upsertLog(
    userId: string,
    input: CreateDailyLogInput,
  ): Promise<{ dto: DailyLogDto; created: boolean }> {
    const { log, created } = await dailyLogRepository.upsert(userId, input);
    const dto = toDailyLogDto(log);

    if (created) {
      logEventEmitter.emitLogCreated(userId, dto);
    } else {
      logEventEmitter.emitLogUpdated(userId, dto);
    }

    return { dto, created };
  },

  async listLogs(
    userId: string,
    range: { from?: string; to?: string },
  ): Promise<{ data: DailyLogDto[]; meta: { from: string; to: string; count: number } }> {
    const { from, to } = range.from && range.to ? { from: range.from, to: range.to } : defaultRange();
    const logs = await dailyLogRepository.findByUserAndRange(userId, from, to);
    return { data: logs.map(toDailyLogDto), meta: { from, to, count: logs.length } };
  },

  async getToday(userId: string): Promise<DailyLogDto | null> {
    const today = new Date().toISOString().slice(0, 10);
    const log = await dailyLogRepository.findByUserAndDate(userId, today);
    return log ? toDailyLogDto(log) : null;
  },
};
