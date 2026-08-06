import { randomBytes } from 'node:crypto';
import { googleOAuthClient } from './google-oauth.client.js';
import { jwtService } from './jwt.service.js';
import { userRepository } from '../user/user.repository.js';
import type { User } from '../user/user.entity.js';

export const authService = {
  generateState(): string {
    return randomBytes(32).toString('hex');
  },

  buildGoogleAuthUrl(state: string): string {
    return googleOAuthClient.buildAuthUrl(state);
  },

  async completeGoogleLogin(code: string): Promise<{ user: User; token: string }> {
    const profile = await googleOAuthClient.exchangeCodeForProfile(code);
    const user = await userRepository.upsertByGoogleId(profile);
    const token = jwtService.sign({ sub: user.id, email: user.email });
    return { user, token };
  },
};
