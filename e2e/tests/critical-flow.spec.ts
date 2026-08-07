import { test, expect } from '@playwright/test';

function uniqueEmail(): string {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

test.describe('critical flow', () => {
  test('login, log today, and see trends update — full round trip', async ({ page }) => {
    // Signs in via the test-only bypass (backend/src/modules/auth/auth.controller.ts —
    // testLogin), which issues the exact same session cookie the real Google callback does.
    // page.request shares the browser context's cookie jar, so this persists into page.goto().
    const loginRes = await page.request.post('/api/auth/test-login', {
      data: { email: uniqueEmail(), name: 'E2E Patient' },
    });
    expect(loginRes.ok()).toBeTruthy();

    await page.goto('/dashboard');
    // DashboardPage greets by first name only ("E2E", not "E2E Patient").
    await expect(page.getByText(/hola, e2e\./i)).toBeVisible();
    await expect(page.getByText(/tómate un minuto para registrarlo/i)).toBeVisible();

    // Log today via the stepped modal — mood alone is enough to submit.
    await page.getByRole('button', { name: 'Registrar mi día' }).click();
    await expect(page.getByRole('dialog', { name: '¿Cómo ha sido tu día?' })).toBeVisible();
    await page.getByRole('radio', { name: 'Muy bien' }).click();
    await page.getByRole('button', { name: 'Guardar ahora' }).click();

    await expect(
      page.getByRole('status').filter({ hasText: /gracias por tomarte el tiempo/i }),
    ).toBeVisible();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Dashboard reflects the save without a manual reload.
    await expect(page.getByText(/ya registraste cómo te sientes hoy/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ajustar registro de hoy' })).toBeVisible();

    // The trend chart is now rendering real data (Recharts' SVG surface), not the empty state.
    await expect(page.locator('.recharts-responsive-container')).toBeVisible();
    await expect(page.getByText('Aún no hay datos')).not.toBeVisible();

    // Weekly/monthly range toggle.
    await page.getByRole('button', { name: 'Mes' }).click();
    await expect(page.getByRole('button', { name: 'Mes' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('a log created in one tab appears live in another via WebSocket — no reload', async ({ browser }) => {
    const context = await browser.newContext();
    const email = uniqueEmail();

    const tabA = await context.newPage();
    await tabA.request.post('/api/auth/test-login', { data: { email, name: 'Live Update' } });
    await tabA.goto('/dashboard');

    // Same authenticated context, so this tab joins the same Socket.IO room for the user —
    // it never reloads or refetches on its own after this.
    const tabB = await context.newPage();
    await tabB.goto('/dashboard');
    await expect(tabB.getByText(/tómate un minuto para registrarlo/i)).toBeVisible();

    await tabA.getByRole('button', { name: 'Registrar mi día' }).click();
    await tabA.getByRole('radio', { name: 'Bien', exact: true }).click();
    await tabA.getByRole('button', { name: 'Guardar ahora' }).click();
    await expect(tabA.getByText(/ya registraste cómo te sientes hoy/i)).toBeVisible();

    await expect(tabB.getByText(/ya registraste cómo te sientes hoy/i)).toBeVisible({ timeout: 5000 });

    await context.close();
  });
});
