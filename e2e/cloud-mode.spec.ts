import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';

async function serveRemoteBuild(page: Page, port: number) {
  // Origine distante virtuelle ; les octets du build sont servis uniquement depuis localhost.
  await page.route('https://budget.example/**', async route => {
    const url = new URL(route.request().url());
    const response = await route.fetch({ url: `http://localhost:${port}${url.pathname}${url.search}` });
    await route.fulfill({ response });
  });
}

test('AC-03 Vercel distant sans clés reste sur la connexion avec erreur de configuration', async ({ page }) => {
  await serveRemoteBuild(page, 4175);
  await page.goto('https://budget.example');
  await expect(page.getByText('Configuration Supabase requise', { exact: true })).toBeVisible();
  await expect(page.getByTestId('storage-mode-badge')).toHaveCount(0);
  await expect(page.getByLabel("Ajouter un compte d'épargne", { exact: true })).toHaveCount(0);
});

test('AC-03 Vercel distant avec clés nécessite une session', async ({ page }) => {
  await serveRemoteBuild(page, 4174);
  await page.goto('https://budget.example');
  await expect(page.getByPlaceholder('nom@exemple.com')).toBeVisible();
  await expect(page.getByTestId('storage-mode-badge')).toHaveCount(0);
  await expect(page.getByLabel("Ajouter un compte d'épargne", { exact: true })).toHaveCount(0);
});

test('AC-03/04 Vercel avec session synthétique conserve ses actions cloud', async ({ page }) => {
  await serveRemoteBuild(page, 4174);
  await page.route('https://synthetic.supabase.invalid/**', async route => {
    const pathname = new URL(route.request().url()).pathname;
    await route.fulfill({ status: 200, contentType: 'application/json', body: pathname.includes('user_settings') ? 'null' : '[]' });
  });
  await page.addInitScript(() => {
    localStorage.setItem('sb-synthetic-auth-token', JSON.stringify({
      access_token: 'synthetic-access-token', refresh_token: 'synthetic-refresh-token', token_type: 'bearer',
      expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600,
      user: { id: 'synthetic-user', email: 'test@example.com', app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '2026-01-01T00:00:00Z' },
    }));
  });
  await page.goto('https://budget.example');
  await expect(page.getByLabel('Gérer mon compte et synchronisation')).toBeVisible();
  await expect(page.getByLabel('Se déconnecter', { exact: true })).toBeVisible();
  await expect(page.getByTestId('storage-mode-badge')).toHaveCount(0);
});

test('AC-03 build Vercel servi sur localhost reste local', async ({ page }) => {
  const cloudRequests: string[] = [];
  await page.route(/supabase\.(?:co|invalid)/, async route => { cloudRequests.push(route.request().url()); await route.abort(); });
  await page.goto('http://localhost:4174');
  await expect(page.getByTestId('storage-mode-badge')).toBeVisible();
  await expect(page.getByLabel('Gérer mon compte et synchronisation')).toHaveCount(0);
  expect(cloudRequests).toEqual([]);
});
