import pino from 'pino';
import { env } from '../config/env.js';

/**
 * One logger instance shared by the HTTP request logger (pino-http, in app.ts) and anything
 * logging outside a request (startup/shutdown in main.ts, background jobs). In development it
 * pretty-prints to a human; in every other environment it stays plain JSON, which is what a
 * log aggregator actually wants.
 */
export const logger = pino({
  level: env.NODE_ENV === 'test' ? 'silent' : env.LOG_LEVEL,
  transport:
    env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
        }
      : undefined,
});
