import { OAuth2Client } from 'google-auth-library';
import { env } from '../../core/config/env.js';

const SCOPES = ['openid', 'email', 'profile'];

const client = new OAuth2Client({
  clientId: env.GOOGLE_CLIENT_ID,
  clientSecret: env.GOOGLE_CLIENT_SECRET,
  redirectUri: env.GOOGLE_REDIRECT_URI,
});

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export const googleOAuthClient = {
  buildAuthUrl(state: string): string {
    return client.generateAuthUrl({
      access_type: 'online',
      scope: SCOPES,
      state,
      prompt: 'select_account',
    });
  },

  async exchangeCodeForProfile(code: string): Promise<GoogleProfile> {
    const { tokens } = await client.getToken({ code, redirect_uri: env.GOOGLE_REDIRECT_URI });
    if (!tokens.id_token) {
      throw new Error('Google token response did not include an id_token');
    }

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) {
      throw new Error('Google id_token payload is missing required fields');
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name ?? payload.email,
      avatarUrl: payload.picture ?? null,
    };
  },
};
