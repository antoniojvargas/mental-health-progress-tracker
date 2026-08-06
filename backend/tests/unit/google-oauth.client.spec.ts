import { jest } from '@jest/globals';
import '../test-env.js';

const generateAuthUrl = jest.fn();
const getToken = jest.fn();
const verifyIdToken = jest.fn();

jest.unstable_mockModule('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    generateAuthUrl,
    getToken,
    verifyIdToken,
  })),
}));

const { googleOAuthClient } = await import('../../src/modules/auth/google-oauth.client.js');

describe('googleOAuthClient', () => {
  beforeEach(() => {
    generateAuthUrl.mockReset();
    getToken.mockReset();
    verifyIdToken.mockReset();
  });

  it('builds a Google consent URL carrying the given state', () => {
    generateAuthUrl.mockReturnValue('https://accounts.google.com/o/oauth2/v2/auth?state=abc123');

    const url = googleOAuthClient.buildAuthUrl('abc123');

    expect(url).toContain('state=abc123');
    expect(generateAuthUrl).toHaveBeenCalledWith(
      expect.objectContaining({ scope: ['openid', 'email', 'profile'], state: 'abc123' }),
    );
  });

  it('exchanges a code for a verified profile', async () => {
    getToken.mockResolvedValue({ tokens: { id_token: 'fake-id-token' } });
    verifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'google-sub-123',
        email: 'patient@example.com',
        name: 'Ada Lovelace',
        picture: 'https://example.com/avatar.png',
      }),
    });

    const profile = await googleOAuthClient.exchangeCodeForProfile('auth-code');

    expect(getToken).toHaveBeenCalledWith(expect.objectContaining({ code: 'auth-code' }));
    expect(verifyIdToken).toHaveBeenCalledWith(expect.objectContaining({ idToken: 'fake-id-token' }));
    expect(profile).toEqual({
      googleId: 'google-sub-123',
      email: 'patient@example.com',
      name: 'Ada Lovelace',
      avatarUrl: 'https://example.com/avatar.png',
    });
  });

  it('falls back to the email as name and null avatar when Google omits them', async () => {
    getToken.mockResolvedValue({ tokens: { id_token: 'fake-id-token' } });
    verifyIdToken.mockResolvedValue({
      getPayload: () => ({ sub: 'google-sub-456', email: 'noname@example.com' }),
    });

    const profile = await googleOAuthClient.exchangeCodeForProfile('auth-code');

    expect(profile.name).toBe('noname@example.com');
    expect(profile.avatarUrl).toBeNull();
  });

  it('throws when Google does not return an id_token', async () => {
    getToken.mockResolvedValue({ tokens: {} });

    await expect(googleOAuthClient.exchangeCodeForProfile('auth-code')).rejects.toThrow(
      'did not include an id_token',
    );
  });

  it('throws when the verified payload is missing required fields', async () => {
    getToken.mockResolvedValue({ tokens: { id_token: 'fake-id-token' } });
    verifyIdToken.mockResolvedValue({ getPayload: () => ({ sub: 'google-sub-789' }) });

    await expect(googleOAuthClient.exchangeCodeForProfile('auth-code')).rejects.toThrow(
      'missing required fields',
    );
  });
});
