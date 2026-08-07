import { test, expect } from '@playwright/test';

// Minimal, fast checks meant to run right after a deploy, before calling it green — not a
// substitute for critical-flow.spec.ts, just "did the thing actually come up".
test.describe('smoke', () => {
  test('frontend serves the login page @smoke', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('link', { name: /continuar con google/i })).toBeVisible();
  });

  test('backend health check reports ok @smoke', async ({ page }) => {
    const res = await page.request.get('/api/health');
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe('ok');
  });

  test('the Socket.IO endpoint is reachable through the proxy @smoke', async ({ page }) => {
    // A real handshake needs an auth cookie (see socket-server.ts) — this only confirms the
    // WebSocket server itself is up and answering, not the full auth flow.
    const res = await page.request.get('/socket.io/?EIO=4&transport=polling');
    expect(res.status()).toBeLessThan(500);
  });
});
