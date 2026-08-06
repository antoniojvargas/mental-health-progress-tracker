import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from '../config/env.js';
import { User } from '../../modules/user/user.entity.js';
import { DailyLog } from '../../modules/daily-log/daily-log.entity.js';
import { InitSchema1754500000000 } from './migrations/1754500000000-InitSchema.js';

// Migrations are imported statically, one by one, rather than loaded via TypeORM's
// directory-glob + dynamic import(). That runtime dynamic import works fine under
// plain Node, but under Jest + ESM its resolution can race with Jest's per-test-file
// environment teardown, intermittently throwing "Test environment has been torn down".
// A static import also means dev (tsx, .ts) and prod (dist, .js) resolve identically,
// with no path/extension guessing needed.
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: env.DATABASE_URL,
  synchronize: false,
  uuidExtension: 'pgcrypto',
  logging: env.NODE_ENV === 'development',
  entities: [User, DailyLog],
  migrations: [InitSchema1754500000000],
});
