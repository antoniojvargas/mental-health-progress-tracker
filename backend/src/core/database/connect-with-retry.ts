import { AppDataSource } from './data-source.js';
import { logger } from '../logging/logger.js';

const MAX_ATTEMPTS = 10;
const BASE_DELAY_MS = 500;
const MAX_DELAY_MS = 10_000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * `docker-compose.yml`'s `depends_on: condition: service_healthy` already gates the backend
 * behind Postgres being ready — this retry exists for the cases that gate doesn't cover: a
 * Postgres restart, an orchestrator without healthcheck-aware startup ordering, or a first
 * `docker compose up` where the healthcheck itself hasn't passed yet. Exponential backoff,
 * capped, rather than crash-looping on the first failed attempt.
 */
export async function connectWithRetry(): Promise<void> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await AppDataSource.initialize();
      return;
    } catch (err) {
      if (attempt === MAX_ATTEMPTS) throw err;
      const backoffMs = Math.min(BASE_DELAY_MS * 2 ** (attempt - 1), MAX_DELAY_MS);
      logger.warn(
        { attempt, maxAttempts: MAX_ATTEMPTS, backoffMs, err },
        'Database connection failed, retrying',
      );
      await delay(backoffMs);
    }
  }
}
