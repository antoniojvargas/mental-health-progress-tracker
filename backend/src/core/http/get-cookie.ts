import type { Request } from 'express';

/**
 * `cookie-parser`'s type declarations leave `req.cookies` typed as `any` (cookie values are
 * inherently untrusted user input, so the library doesn't pretend to know their shape). This is
 * the one place that boundary gets crossed with an explicit cast, so every call site gets a
 * real `string | undefined` instead of repeating the same unsafe access.
 */
export function getCookie(req: Request, name: string): string | undefined {
  const cookies = req.cookies as Record<string, string> | undefined;
  return cookies?.[name];
}
