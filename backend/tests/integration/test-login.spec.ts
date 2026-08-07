import request from 'supertest';
import { app } from '../helpers/build-app.js';

describe('POST /api/auth/test-login', () => {
  it('is registered under NODE_ENV=test and issues a real, working session cookie', async () => {
    const res = await request(app)
      .post('/api/auth/test-login')
      .send({ email: 'e2e@example.com', name: 'E2E' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ email: 'e2e@example.com', name: 'E2E' });
    const cookie = res.headers['set-cookie']?.[0];
    expect(cookie).toContain('access_token=');
    expect(cookie).toContain('HttpOnly');

    const me = await request(app).get('/api/auth/me').set('Cookie', cookie);
    expect(me.status).toBe(200);
    expect(me.body.email).toBe('e2e@example.com');
  });

  it('rejects a request with no email', async () => {
    const res = await request(app).post('/api/auth/test-login').send({});
    expect(res.status).toBe(400);
  });

  it('is idempotent for the same email — upserts rather than creating duplicate users', async () => {
    const first = await request(app).post('/api/auth/test-login').send({ email: 'repeat@example.com' });
    const second = await request(app).post('/api/auth/test-login').send({ email: 'repeat@example.com' });
    expect(first.body.id).toBe(second.body.id);
  });
});
