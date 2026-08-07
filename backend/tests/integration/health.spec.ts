import request from 'supertest';
import { app } from '../helpers/build-app.js';

describe('GET /api/health', () => {
  it('responds ok with an uptime figure when the database is reachable', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.uptime).toBe('number');
  });

  // The 503-on-unreachable-DB path is intentionally not exercised here: it would mean
  // destroying the shared AppDataSource connection this whole test file (and its
  // afterEach truncation) depends on. Verified manually instead — see docs/architecture.md.
});
