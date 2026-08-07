import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.js';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      css: false,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/main.tsx', 'src/test/**', 'src/**/*.spec.{ts,tsx}', 'src/types/**'],
        // A floor, not a ceiling — a few points below the actual current numbers (see
        // `npm run test:coverage`), so it catches a real regression without breaking CI on
        // normal fluctuation.
        thresholds: {
          statements: 70,
          branches: 65,
          functions: 65,
          lines: 72,
        },
      },
    },
  }),
);
