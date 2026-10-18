import { test as baseTest, expect } from './fixtures';
import type { Page } from '@playwright/test';

const test = baseTest.extend({
  consoleGuard: async ({ page, expectedOfflineSupabase }, use) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      const expectedTransportFailure = expectedOfflineSupabase && /net::ERR_INTERNET_DISCONNECTED/.test(msg.text()) &&
        /^https:\/\/synthetic\.supabase\.invalid\/rest\/v1\//.test(msg.location().url);
      const expected400 = /Failed to load resource: the server responded with a status of 400/.test(msg.text());
      if (msg.type() === 'error' && !expectedTransportFailure && !expected400 && !/Download the React DevTools/i.test(msg.text())) {
        errors.push(`console.error: ${msg.text()}`);
      }
    });
    page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
    page.on('response', (res) => {
      if (res.status() >= 500) errors.push(`HTTP ${res.status()}: ${res.url()}`);
    });

    await use();

    expect(errors, 'Browser errors detected during the test').toEqual([]);
  },
});

async function serveRemoteBuild(page: Page, port: number) {
  // Origine distante virtuelle ; les octets du build sont servis uniquement depuis localhost.
  await page.route('https://budget.example/**', async route => {
    const url = new URL(route.request().url());
    const response = await route.fetch({ url: `http://localhost:${port}${url.pathname}${url.search}` });
    await route.fulfill({ response });
  });
}

const syntheticUser = { id: '00000000-0000-4000-8000-000000000001', email: 'test@example.com', app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '2026-01-01T00:00:00Z' };

async function cloudSession(page: Page) {
  await page.addInitScript(user => {
    localStorage.setItem('sb-synthetic-auth-token', JSON.stringify({
      access_token: 'synthetic-access-token', refresh_token: 'synthetic-refresh-token', token_type: 'bearer',
      expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600, user,
    }));
  }, syntheticUser);
}

// ============================================================================
// §5 — Les 7 cas de test obligatoires
// ============================================================================

// (1) build cloud servi sur localhost → app directe, pas d'AuthScreen
test('AC-03 (1) build cloud servi sur localhost -> app directe, pas d\'AuthScreen', async ({ page }) => {
  const cloudRequests: string[] = [];
  await page.route(/supabase\.(?:co|invalid)/, async route => {
    cloudRequests.push(route.request().url());
    await route.abort();
  });
  await page.goto('http://localhost:4174');
  await expect(page.getByTestId('storage-mode-badge')).toBeVisible();
  await expect(page.getByPlaceholder('nom@exemple.com')).toHaveCount(0);
  await expect(page.getByLabel('Gérer mon compte et synchronisation')).toHaveCount(0);
  expect(cloudRequests).toEqual([]);
});

// (2) cloud sans session → AuthScreen seul, aucune donnée
test('AC-03 (2) cloud sans session -> AuthScreen seul, aucune donnee', async ({ page }) => {
  await serveRemoteBuild(page, 4174);
  await page.goto('https://budget.example');
  await expect(page.getByPlaceholder('nom@exemple.com')).toBeVisible();
  await expect(page.getByTestId('storage-mode-badge')).toHaveCount(0);
  await expect(page.getByLabel("Ajouter un compte d'épargne", { exact: true })).toHaveCount(0);
});

// (3) validation du formulaire sans appel réseau
test('AC-03 (3) validation du formulaire sans appel reseau', async ({ page }) => {
  await serveRemoteBuild(page, 4174);
  const cloudRequests: string[] = [];
  await page.route(/supabase\.(?:co|invalid)/, async route => {
    cloudRequests.push(route.request().url());
    await route.abort();
  });
  await page.goto('https://budget.example');
  await expect(page.getByPlaceholder('nom@exemple.com')).toBeVisible();
  await page.getByPlaceholder('nom@exemple.com').fill('invalide');
  await page.getByPlaceholder('••••••••').fill('123');
  await page.getByText('Se connecter', { exact: true }).click();
  await expect(page.getByText('Saisissez une adresse email valide et un mot de passe de 6 caractères minimum.')).toBeVisible();
  expect(cloudRequests).toEqual([]);
});

// (4) mauvais mot de passe → message visible (« Adresse e-mail ou mot de passe incorrect. »), champs conservés
test('AC-03 (4) mauvais mot de passe -> message visible, champs conserves', async ({ page }) => {
  await serveRemoteBuild(page, 4174);
  await page.route('https://synthetic.supabase.invalid/auth/v1/token?grant_type=password', async route => {
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 'invalid_credentials',
        error_code: 'invalid_credentials',
        msg: 'Invalid login credentials',
        message: 'Invalid login credentials',
      }),
    });
  });
  await page.goto('https://budget.example');
  await expect(page.getByPlaceholder('nom@exemple.com')).toBeVisible();
  await page.getByPlaceholder('nom@exemple.com').fill('test@example.com');
  await page.getByPlaceholder('••••••••').fill('badpassword123');
  await page.getByText('Se connecter', { exact: true }).click();
  await expect(page.getByText('Adresse e-mail ou mot de passe incorrect.')).toBeVisible();
  await expect(page.getByPlaceholder('nom@exemple.com')).toHaveValue('test@example.com');
});

// (5) connexion → app + identité dans le Header
test('AC-03 (5) connexion -> app + identite dans le Header', async ({ page }) => {
  await serveRemoteBuild(page, 4174);
  const user = {
    id: '00000000-0000-4000-8000-000000000002',
    email: 'monbudget@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2026-01-01T00:00:00Z',
  };
  await page.route('https://synthetic.supabase.invalid/**', async route => {
    const url = new URL(route.request().url());
    if (url.pathname.includes('/auth/v1/token')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'synthetic-jwt-token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'synthetic-refresh-jwt',
          user,
        }),
      });
      return;
    }
    if (url.pathname.includes('/auth/v1/user')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(user) });
      return;
    }
    if (url.pathname.includes('user_settings')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await page.goto('https://budget.example');
  await page.getByPlaceholder('nom@exemple.com').fill('monbudget@example.com');
  await page.getByPlaceholder('••••••••').fill('secret123');
  await page.getByText('Se connecter', { exact: true }).click();
  await expect(page.getByLabel('Gérer mon compte et synchronisation')).toBeVisible();
  await expect(page.getByText('🟢 monbudget')).toBeVisible();
  await expect(page.getByLabel('Se déconnecter', { exact: true })).toBeVisible();
});

// (6) déconnexion → retour AuthScreen et cache vidé
test('AC-03 (6) deconnexion -> retour AuthScreen et cache vide', async ({ page }) => {
  await serveRemoteBuild(page, 4174);
  await cloudSession(page);
  await page.route('https://synthetic.supabase.invalid/**', async route => {
    const url = new URL(route.request().url());
    if (url.pathname.includes('/auth/v1/logout')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      return;
    }
    if (url.pathname.includes('/auth/v1/user')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(syntheticUser) });
      return;
    }
    if (url.pathname.includes('user_settings')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await page.addInitScript(() => {
    localStorage.setItem('@nova_savings_v3', JSON.stringify([{ id: 'sav-1', name: 'Livret A', category: 'securite', amount: 5000, rate: 3 }]));
    localStorage.setItem('@nova_expenses_v3', JSON.stringify([]));
    localStorage.setItem('@nova_safety_cushion_v3', '15000');
    localStorage.setItem('@novabudget_legacy_v1', 'legacy-data');
    localStorage.setItem('other_app_token', 'preserve-this');
  });
  await page.goto('https://budget.example');
  await expect(page.getByLabel('Se déconnecter', { exact: true })).toBeVisible();
  await page.getByLabel('Se déconnecter', { exact: true }).click();
  await expect(page.getByPlaceholder('nom@exemple.com')).toBeVisible();
  const remainingKeys = await page.evaluate(() => Object.keys(localStorage));
  const novaKeys = remainingKeys.filter(k => k.startsWith('@nova') || k.startsWith('@novabudget'));
  expect(novaKeys).toEqual([]);
  expect(remainingKeys).toContain('other_app_token');
});

// (7) cloud sans clés → bandeau de configuration (« Configuration Supabase requise »)
test('AC-03 (7) cloud sans cles -> bandeau de configuration', async ({ page }) => {
  await serveRemoteBuild(page, 4175);
  await page.goto('https://budget.example');
  await expect(page.getByText('Configuration Supabase requise', { exact: true })).toBeVisible();
  await expect(page.getByTestId('storage-mode-badge')).toHaveCount(0);
  await expect(page.getByLabel("Ajouter un compte d'épargne", { exact: true })).toHaveCount(0);
});

// ============================================================================
// Tests de non-régression existants
// ============================================================================

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

test('AC-S01/02/03 cloud CRUD survives reload; empty server and pull clear cache without writes', async ({ page }) => {
  await serveRemoteBuild(page, 4174);
  await cloudSession(page);
  type Row = Record<string, unknown>;
  const tables: Record<string, Row[]> = { savings_accounts: [], expenses: [], future_projects: [], inflows: [], user_settings: [] };
  const writes: string[] = [];
  const profiles: string[] = [];
  await page.route('https://synthetic.supabase.invalid/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname.startsWith('/auth/')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(syntheticUser) });
      return;
    }
    const table = url.pathname.split('/').pop()!;
    profiles.push(request.headers()['accept-profile'] ?? request.headers()['content-profile'] ?? '');
    const method = request.method();
    if (method === 'POST') {
      writes.push(table);
      const payload: Row | Row[] = request.postDataJSON();
      for (const row of Array.isArray(payload) ? payload : [payload]) {
        const key = table === 'user_settings' ? 'user_id' : 'id';
        const index = tables[table].findIndex(item => item[key] === row[key]);
        const merged = { created_at: '2026-01-01T00:00:00Z', ...tables[table][index], ...row };
        if (index < 0) tables[table].push(merged); else tables[table][index] = merged;
      }
      await route.fulfill({ status: 201, contentType: 'application/json', body: 'null' });
      return;
    }
    if (method === 'DELETE') {
      writes.push(table);
      const id = url.searchParams.get('id')?.replace(/^eq\./, '');
      tables[table] = tables[table].filter(row => row.id !== id);
      await route.fulfill({ status: 204, body: '' });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(table === 'user_settings' ? tables[table][0] ?? null : tables[table]) });
  });
  await page.goto('https://budget.example');
  await expect(page.getByTestId('dashboard-loading')).toHaveCount(0);
  expect(writes).toEqual([]);
  await page.getByLabel("Ajouter un compte d'épargne", { exact: true }).click();
  await page.getByPlaceholder('Ex: Livret A BoursoBank, PEA Fortuneo...').fill('Épargne cloud');
  await page.getByPlaceholder('Ex: 5000').fill('2500');
  await page.getByText('Enregistrer', { exact: true }).filter({ visible: true }).click();
  await expect(page.getByLabel('Supprimer Épargne cloud', { exact: true })).toBeVisible();
  expect(tables.savings_accounts).toHaveLength(1);
  await page.reload();
  await expect(page.getByText('Épargne cloud', { exact: true })).toBeVisible();
  await page.getByLabel('Supprimer Épargne cloud', { exact: true }).click();
  await expect.poll(() => tables.savings_accounts.length).toBe(0);
  await page.reload();
  await expect(page.getByLabel('Supprimer Épargne cloud', { exact: true })).toHaveCount(0);
  expect(writes).toEqual(['savings_accounts', 'savings_accounts']);
  await page.evaluate(() => localStorage.setItem('@nova_savings_v3', JSON.stringify([{ id: 'stale', name: 'Cache obsolète', category: 'securite', amount: 50, rate: 0 }])));
  await page.getByLabel('Gérer mon compte et synchronisation').click();
  await page.getByText('⬇️ Restaurer (Pull)', { exact: true }).click();
  await expect(page.getByText('Données restaurées depuis le Cloud avec succès !', { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('@nova_savings_v3'))).toBe('[]');
  expect(writes).toEqual(['savings_accounts', 'savings_accounts']);
  expect(profiles.every(profile => profile === 'nova')).toBe(true);
});

test.describe('offline cloud cache', () => {
  test.use({ expectedOfflineSupabase: true });
  test('AC-S03 cloud reload displays existing cache and French feedback when API is offline', async ({ page }) => {
    await serveRemoteBuild(page, 4174);
    await cloudSession(page);
    let blocked = 0;
    await page.route('https://synthetic.supabase.invalid/rest/v1/**', async route => {
      blocked += 1;
      await route.abort('internetdisconnected');
    });
    await page.addInitScript(() => {
      localStorage.setItem('@nova_savings_v3', JSON.stringify([{ id: 'offline', name: 'Livret hors ligne', category: 'securite', amount: 4321, rate: 2 }]));
      localStorage.setItem('@nova_monthly_contribution_v3', JSON.stringify({ monthlyTotal: 1234 }));
      localStorage.setItem('@nova_safety_cushion_v3', '14500');
    });
    await page.goto('https://budget.example');
    await expect(page.getByText('Livret hors ligne', { exact: true })).toBeVisible();
    await expect(page.getByTestId('dashboard-error')).toContainText('Le cache local reste affiché');
    await expect(page.getByLabel('Seuil de sécurité en euros')).toHaveValue('14500');
    await expect(page.getByText(/^1[\s\u202f\u00a0]?234\s*€$/)).toBeVisible();
    await page.reload();
    await expect(page.getByText('Livret hors ligne', { exact: true })).toBeVisible();
    await expect(page.getByTestId('dashboard-error')).toContainText('vérifiez votre connexion');
    expect(blocked).toBeGreaterThan(0);
    await page.screenshot({ path: 'test-results/cloud-offline-cache.png', fullPage: true });
  });
});

test('AC-S04 web URL callback restores the session then logout returns to authentication', async ({ page }) => {
  await serveRemoteBuild(page, 4174);
  await page.route('https://synthetic.supabase.invalid/**', async route => {
    const url = new URL(route.request().url());
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(url.pathname.includes('/auth/v1/user') ? syntheticUser : url.pathname.includes('user_settings') ? null : []),
    });
  });
  await page.goto('https://budget.example/#access_token=synthetic-access-token&refresh_token=synthetic-refresh-token&expires_in=3600&token_type=bearer&type=signup');
  await expect(page.getByLabel('Gérer mon compte et synchronisation')).toBeVisible();
  await expect.poll(() => page.evaluate(() => location.hash)).toBe('');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('sb-synthetic-auth-token'))).toContain('synthetic-access-token');
  await page.getByLabel('Se déconnecter', { exact: true }).click();
  await expect(page.getByPlaceholder('nom@exemple.com')).toBeVisible();
});
