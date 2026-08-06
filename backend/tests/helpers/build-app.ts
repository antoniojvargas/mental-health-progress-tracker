import request from 'supertest';
import { createApp } from '../../src/app.js';
import { userRepository } from '../../src/modules/user/user.repository.js';
import { jwtService } from '../../src/modules/auth/jwt.service.js';

export const app = createApp();

export async function createTestUser(overrides: Partial<{ googleId: string; email: string; name: string }> = {}) {
  const suffix = Math.random().toString(36).slice(2, 8);
  const user = await userRepository.upsertByGoogleId({
    googleId: overrides.googleId ?? `google-${suffix}`,
    email: overrides.email ?? `user-${suffix}@example.com`,
    name: overrides.name ?? 'Test User',
    avatarUrl: null,
  });
  const token = jwtService.sign({ sub: user.id, email: user.email });
  return { user, token, cookie: `access_token=${token}` };
}

export function authedRequest() {
  return request(app);
}
