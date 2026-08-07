import 'reflect-metadata';
import { createServer } from 'node:http';
import { createApp } from './app.js';
import { AppDataSource } from './core/database/data-source.js';
import { connectWithRetry } from './core/database/connect-with-retry.js';
import { env } from './core/config/env.js';
import { logger } from './core/logging/logger.js';
import { createSocketServer } from './realtime/socket-server.js';
import { setLogEventEmitter } from './modules/daily-log/daily-log.service.js';
import { createSocketLogEmitter } from './realtime/log-events.js';

const SHUTDOWN_TIMEOUT_MS = 10_000;

async function main(): Promise<void> {
  await connectWithRetry();
  await AppDataSource.runMigrations();
  logger.info('Database connected and migrations applied');

  const app = createApp();
  const httpServer = createServer(app);

  const io = createSocketServer(httpServer);
  setLogEventEmitter(createSocketLogEmitter(io));

  httpServer.listen(env.PORT, () => {
    logger.info(`Backend listening on port ${env.PORT}`);
  });

  let shuttingDown = false;

  async function shutdown(signal: string): Promise<void> {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, 'Shutting down gracefully');

    const forceExit = setTimeout(() => {
      logger.error('Graceful shutdown timed out, forcing exit');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    forceExit.unref();

    try {
      await io.close();
      await new Promise<void>((resolve) => httpServer.close(() => resolve()));
      await AppDataSource.destroy();
      clearTimeout(forceExit);
      logger.info('Shutdown complete');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error during shutdown');
      process.exit(1);
    }
  }

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled promise rejection');
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught exception');
  process.exit(1);
});

main().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
