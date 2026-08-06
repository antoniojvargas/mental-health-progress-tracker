import './test-env.js';
import { AppDataSource } from '../src/core/database/data-source.js';
beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }
    await AppDataSource.runMigrations();
});
afterEach(async () => {
    await AppDataSource.query('TRUNCATE TABLE "daily_logs", "users" CASCADE');
});
afterAll(async () => {
    await AppDataSource.destroy();
});
//# sourceMappingURL=setup.js.map