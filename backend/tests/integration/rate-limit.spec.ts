import request from 'supertest';
import { createApp } from '../../src/app.js';
import { createTestUser } from '../helpers/build-app.js';
import type { CreateDailyLogInput } from '../../src/modules/daily-log/daily-log.schema.js';

function validLog(): CreateDailyLogInput {
  return {
    logDate: new Date(Date.now() - 3 * 86_400_000).toISOString().slice(0, 10),
    moodRating: 3,
    anxietyLevel: 4,
    stressLevel: 5,
    sleepHours: 7,
    sleepQuality: 3,
    sleepDisturbances: [],
    activityType: null,
    activityMinutes: null,
    socialFrequency: 'occasional',
    symptoms: [],
    notes: null,
  };
}

// Each test builds its own app instance so its rate-limiter state can't bleed into (or be
// exhausted by) any other test file or test in this one.
describe('rate limiting', () => {
  it('blocks Google login attempts past the limit within the window', async () => {
    const app = createApp();

    const responses = await Promise.all(
      Array.from({ length: 21 }, () => request(app).get('/api/auth/google')),
    );
    const statuses = responses.map((r) => r.status);

    expect(statuses.filter((s) => s === 302)).toHaveLength(20);
    expect(statuses.filter((s) => s === 429)).toHaveLength(1);
  });

  it("blocks a user's daily-log writes past the limit, without touching another user's budget", async () => {
    const app = createApp();
    const owner = await createTestUser();
    const other = await createTestUser();

    const responses = await Promise.all(
      Array.from({ length: 31 }, () =>
        request(app).post('/api/logs').set('Cookie', owner.cookie).send(validLog()),
      ),
    );
    const statuses = responses.map((r) => r.status);

    expect(statuses.filter((s) => s === 429)).toHaveLength(1);
    expect(statuses.filter((s) => s !== 429)).toHaveLength(30);

    const otherRes = await request(app).post('/api/logs').set('Cookie', other.cookie).send(validLog());
    expect(otherRes.status).not.toBe(429);
  });
});
