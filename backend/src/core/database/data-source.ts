import 'reflect-metadata';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { DataSource } from 'typeorm';
import { env } from '../config/env.js';
import { User } from '../../modules/user/user.entity.js';
import { DailyLog } from '../../modules/daily-log/daily-log.entity.js';

// Resolve relative to this file so migrations load correctly both under tsx (src/*.ts)
// and from a compiled build (dist/*.js).
const migrationsExtension = path.extname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations');

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: env.DATABASE_URL,
  synchronize: false,
  uuidExtension: 'pgcrypto',
  logging: env.NODE_ENV === 'development',
  entities: [User, DailyLog],
  migrations: [path.join(migrationsDir, `*${migrationsExtension}`)],
});
