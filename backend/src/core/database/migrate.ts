import 'reflect-metadata';
import { AppDataSource } from './data-source.js';

const command = process.argv[2];

async function run(): Promise<void> {
  await AppDataSource.initialize();

  if (command === 'revert') {
    await AppDataSource.undoLastMigration();
    console.log('Reverted last migration');
  } else {
    const applied = await AppDataSource.runMigrations();
    console.log(applied.length ? `Applied ${applied.length} migration(s)` : 'No pending migrations');
  }

  await AppDataSource.destroy();
}

run().catch((err) => {
  console.error('Migration failed', err);
  process.exit(1);
});
