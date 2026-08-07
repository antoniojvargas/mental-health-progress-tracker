/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true, tsconfig: 'tsconfig.test.json' }],
  },
  testMatch: ['**/tests/**/*.spec.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 15000,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/main.ts',
    '!src/core/database/migrations/**',
    '!src/core/database/seeds/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'html', 'lcov'],
  // A floor, not a ceiling — set a few points below the actual current numbers (see
  // `npm run test:coverage`) so normal fluctuation doesn't break CI, while still catching a
  // real regression (e.g. a whole new module landing with no tests at all).
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 55,
      functions: 75,
      lines: 72,
    },
  },
};
