import { defineConfig, devices } from '@playwright/test';

// Points at an already-running stack — start it first with:
//   docker compose -f ../docker-compose.yml -f ../docker-compose.e2e.yml up -d --build
// (the .e2e override sets NODE_ENV=test on the backend, which is what registers
// POST /api/auth/test-login — see backend/src/modules/auth/auth.routes.ts).
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
