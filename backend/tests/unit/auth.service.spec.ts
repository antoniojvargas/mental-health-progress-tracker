import '../test-env.js';
import { authService } from '../../src/modules/auth/auth.service.js';

describe('authService.generateState', () => {
  it('generates a 64-character hex string (32 random bytes)', () => {
    const state = authService.generateState();
    expect(state).toMatch(/^[0-9a-f]{64}$/);
  });

  it('never repeats across calls — this is the CSRF defense for the OAuth handshake', () => {
    const states = new Set(Array.from({ length: 200 }, () => authService.generateState()));
    expect(states.size).toBe(200);
  });
});

describe('authService.buildGoogleAuthUrl', () => {
  it('embeds the given state in the generated Google consent URL', () => {
    const url = authService.buildGoogleAuthUrl('abc123state');
    expect(url).toContain('accounts.google.com');
    expect(url).toContain('state=abc123state');
  });
});
