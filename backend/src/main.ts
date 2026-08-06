import 'reflect-metadata';
import { createServer } from 'node:http';
import { createApp } from './app.js';
import { AppDataSource } from './core/database/data-source.js';
import { env } from './core/config/env.js';
import { createSocketServer } from './realtime/socket-server.js';
import { setLogEventEmitter } from './modules/daily-log/daily-log.service.js';
import { createSocketLogEmitter } from './realtime/log-events.js';

async function main(): Promise<void> {
  await AppDataSource.initialize();
  await AppDataSource.runMigrations();
  console.log('Database connected and migrations applied');

  const app = createApp();
  const httpServer = createServer(app);

  const io = createSocketServer(httpServer);
  setLogEventEmitter(createSocketLogEmitter(io));

  httpServer.listen(env.PORT, () => {
    console.log(`Backend listening on port ${env.PORT}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
