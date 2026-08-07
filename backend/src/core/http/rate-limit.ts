import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

const rateLimitedResponse = (message: string) => ({
  error: { code: 'RATE_LIMITED', message, details: [] },
});

// Unauthenticated: /google and /google/callback are the only entry points an attacker could
// hammer before ever holding a session, so this is keyed by IP.
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitedResponse('Demasiados intentos de inicio de sesión. Intenta de nuevo más tarde.'),
});

// Authenticated: keyed by user id (via requireAuth, which must run first) rather than IP, so
// one patient's writes never eat into another's budget just for sharing a network.
export const writeRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id ?? ipKeyGenerator(req.ip ?? 'unknown'),
  message: rateLimitedResponse('Demasiadas solicitudes. Intenta de nuevo más tarde.'),
});
