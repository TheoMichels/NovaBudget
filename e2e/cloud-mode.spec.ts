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

const syntheticUser = { id: '00000000-0000-4000-8000-000000000001', email: 'test@example.com', app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '2026-01-01T00:00:00Z' };
async function cloudSession(page: Page) {
  await page.addInitScript(user => {
    localStorage.setItem('sb-synthetic-auth-token', JSON.stringify({
      access_token:'synthetic-access-token', refresh_token:'synthetic-refresh-token', token_type:'bearer',
      expires_at: Math.floor(Date.now()/1000)+3600,expires_in:3600,user,
    }));
  }, syntheticUser);
}

test('AC-S01/02/03 cloud CRUD survives reload; empty server and pull clear cache without writes', async ({ page }) => {
  await serveRemoteBuild(page,4174);await cloudSession(page);
  type Row = Record<string, unknown>;
  const tables: Record<string, Row[]> = { savings_accounts:[],expenses:[],future_projects:[],inflows:[],user_settings:[] };
  const writes: string[] = [];
  const profiles: string[] = [];
  await page.route('https://synthetic.supabase.invalid/**',async route=>{
    const request=route.request();const url=new URL(request.url());
    if(url.pathname.startsWith('/auth/')) {await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(syntheticUser)});return;}
    const table=url.pathname.split('/').pop()!;
    profiles.push(request.headers()['accept-profile']??request.headers()['content-profile']??'');
    const method=request.method();
    if(method==='POST'){
      writes.push(table);const payload:Row|Row[]=request.postDataJSON();
      for(const row of Array.isArray(payload)?payload:[payload]) {
        const key=table==='user_settings'?'user_id':'id';
        const index=tables[table].findIndex(item=>item[key]===row[key]);
        const merged={created_at:'2026-01-01T00:00:00Z',...tables[table][index],...row};
        if(index<0)tables[table].push(merged);else tables[table][index]=merged;
      }
      await route.fulfill({status:201,contentType:'application/json',body:'null'});return;
    }
    if(method==='DELETE'){
      writes.push(table);const id=url.searchParams.get('id')?.replace(/^eq\./,'');
      tables[table]=tables[table].filter(row=>row.id!==id);
      await route.fulfill({status:204,body:''});return;
    }
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(table==='user_settings'?tables[table][0]??null:tables[table])});
  });
  await page.goto('https://budget.example');
  await expect(page.getByTestId('dashboard-loading')).toHaveCount(0);
  expect(writes).toEqual([]);
  await page.getByLabel("Ajouter un compte d'épargne",{exact:true}).click();
  await page.getByPlaceholder('Ex: Livret A BoursoBank, PEA Fortuneo...').fill('Épargne cloud');
  await page.getByPlaceholder('Ex: 5000').fill('2500');
  await page.getByText('Enregistrer',{exact:true}).filter({visible:true}).click();
  await expect(page.getByLabel('Supprimer Épargne cloud',{exact:true})).toBeVisible();
  expect(tables.savings_accounts).toHaveLength(1);
  await page.reload();
  await expect(page.getByText('Épargne cloud',{exact:true})).toBeVisible();
  await page.getByLabel('Supprimer Épargne cloud',{exact:true}).click();
  await expect.poll(()=>tables.savings_accounts.length).toBe(0);
  await page.reload();
  await expect(page.getByLabel('Supprimer Épargne cloud',{exact:true})).toHaveCount(0);
  expect(writes).toEqual(['savings_accounts','savings_accounts']);
  await page.evaluate(()=>localStorage.setItem('@novabudget_savings_v3',JSON.stringify([{id:'stale',name:'Cache obsolète',category:'securite',amount:50,rate:0}])));
  await page.getByLabel('Gérer mon compte et synchronisation').click();
  await page.getByText('⬇️ Restaurer (Pull)',{exact:true}).click();
  await expect(page.getByText('Données restaurées depuis le Cloud avec succès !',{exact:true})).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>localStorage.getItem('@novabudget_savings_v3'))).toBe('[]');
  expect(writes).toEqual(['savings_accounts','savings_accounts']);
  expect(profiles.every(profile=>profile==='novabudget')).toBe(true);
});

test.describe('offline cloud cache',()=>{
  test.use({expectedOfflineSupabase:true});
  test('AC-S03 cloud reload displays existing cache and French feedback when API is offline',async({page})=>{
    await serveRemoteBuild(page,4174);await cloudSession(page);
    let blocked=0;
    await page.route('https://synthetic.supabase.invalid/rest/v1/**',async route=>{blocked+=1;await route.abort('internetdisconnected');});
    await page.addInitScript(()=>{
      localStorage.setItem('@novabudget_savings_v3',JSON.stringify([{id:'offline',name:'Livret hors ligne',category:'securite',amount:4321,rate:2}]));
      localStorage.setItem('@novabudget_monthly_contribution_v3',JSON.stringify({monthlyTotal:1234}));
      localStorage.setItem('@novabudget_safety_cushion_v3','14500');
    });
    await page.goto('https://budget.example');
    await expect(page.getByText('Livret hors ligne',{exact:true})).toBeVisible();
    await expect(page.getByTestId('dashboard-error')).toContainText('Le cache local reste affiché');
    await expect(page.getByLabel('Seuil de sécurité en euros')).toHaveValue('14500');
    await expect(page.getByText(/^1[\s\u202f\u00a0]?234\s*€$/)).toBeVisible();
    await page.reload();
    await expect(page.getByText('Livret hors ligne',{exact:true})).toBeVisible();
    await expect(page.getByTestId('dashboard-error')).toContainText('vérifiez votre connexion');
    expect(blocked).toBeGreaterThan(0);
    await page.screenshot({path:'test-results/cloud-offline-cache.png',fullPage:true});
  });
});

test('AC-S04 web URL callback restores the session then logout returns to authentication',async({page})=>{
  await serveRemoteBuild(page,4174);
  await page.route('https://synthetic.supabase.invalid/**',async route=>{
    const url=new URL(route.request().url());
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(url.pathname.includes('/auth/v1/user')?syntheticUser:url.pathname.includes('user_settings')?null:[])});
  });
  await page.goto('https://budget.example/#access_token=synthetic-access-token&refresh_token=synthetic-refresh-token&expires_in=3600&token_type=bearer&type=signup');
  await expect(page.getByLabel('Gérer mon compte et synchronisation')).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>location.hash)).toBe('');
  await expect.poll(()=>page.evaluate(()=>localStorage.getItem('sb-synthetic-auth-token'))).toContain('synthetic-access-token');
  await page.getByLabel('Se déconnecter',{exact:true}).click();
  await expect(page.getByPlaceholder('nom@exemple.com')).toBeVisible();
});
