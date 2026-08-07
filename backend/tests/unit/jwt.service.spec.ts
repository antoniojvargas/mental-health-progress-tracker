import '../test-env.js';
import jwt from 'jsonwebtoken';
import { jwtService } from '../../src/modules/auth/jwt.service.js';
import { env } from '../../src/core/config/env.js';

describe('jwtService', () => {
  it('signs a token that verifies back to the same payload', () => {
    const token = jwtService.sign({ sub: 'user-1', email: 'a@example.com' });
    const payload = jwtService.verify(token);
    // jsonwebtoken adds its own `iat`/`exp` claims on top of what we signed — assert on our
    // fields specifically rather than the exact object shape.
    expect(payload).toMatchObject({ sub: 'user-1', email: 'a@example.com' });
  });

  it('returns null for a malformed token instead of throwing', () => {
    expect(jwtService.verify('not-a-real-token')).toBeNull();
  });

  it('returns null for a token signed with a different secret', () => {
    // A token from a would-be attacker (or a previous JWT_SECRET rotation) must never verify.
    const forged = jwt.sign({ sub: 'user-1', email: 'a@example.com' }, 'a-completely-different-secret');
    expect(jwtService.verify(forged)).toBeNull();
  });

  it('returns null for an expired token', () => {
    const expired = jwt.sign({ sub: 'user-1', email: 'a@example.com' }, env.JWT_SECRET, {
      expiresIn: -1,
    });
    expect(jwtService.verify(expired)).toBeNull();
  });
});
