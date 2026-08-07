import request from 'supertest';
import { app, createTestUser } from '../helpers/build-app.js';

describe('auth', () => {
  it('GET /api/auth/me returns 401 without a session cookie', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('GET /api/auth/me returns the current user with a valid session cookie', async () => {
    const { user, cookie } = await createTestUser({ email: 'me@example.com', name: 'Ada Lovelace' });
    const res = await request(app).get('/api/auth/me').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: user.id, email: 'me@example.com', name: 'Ada Lovelace' });
  });

  it('GET /api/auth/google redirects to Google with a state cookie', async () => {
    const res = await request(app).get('/api/auth/google');
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('accounts.google.com');
    expect(res.headers['set-cookie']?.[0]).toContain('oauth_state=');
  });

  it('POST /api/auth/logout clears the session cookie', async () => {
    const { cookie } = await createTestUser();
    const res = await request(app).post('/api/auth/logout').set('Cookie', cookie);
    expect(res.status).toBe(204);
    expect(res.headers['set-cookie']?.[0]).toContain('access_token=;');
  });
});
