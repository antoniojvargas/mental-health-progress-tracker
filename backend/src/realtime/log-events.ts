import type { Server } from 'socket.io';
import type { DailyLogDto } from '../modules/daily-log/daily-log.mapper.js';

export interface LogEventEmitter {
  emitLogCreated(userId: string, log: DailyLogDto): void;
  emitLogUpdated(userId: string, log: DailyLogDto): void;
}

function userRoom(userId: string): string {
  return `user:${userId}`;
}

export function createSocketLogEmitter(io: Server): LogEventEmitter {
  return {
    emitLogCreated(userId, log) {
      io.to(userRoom(userId)).emit('log:created', log);
    },
    emitLogUpdated(userId, log) {
      io.to(userRoom(userId)).emit('log:updated', log);
    },
  };
}

export { userRoom };
