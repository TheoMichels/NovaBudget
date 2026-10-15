import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadTypeScript } from './helpers/load-typescript.mjs';

const storage = { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} };
function client({ vercel = false, hostname, keys = true } = {}) {
  let created = 0;
  const result = loadTypeScript('src/services/supabaseClient.ts', {
    'react-native': { Platform: { OS: 'web' } },
    '@react-native-async-storage/async-storage': storage,
    'expo-constants': { expoConfig: { extra: { storageMode: vercel ? 'supabase' : 'local' } } },
    '@supabase/supabase-js': { createClient: () => { created++; return { testClient: true }; } },
  }, {
    process: { env: keys ? { EXPO_PUBLIC_SUPABASE_URL: 'https://synthetic.supabase.invalid', EXPO_PUBLIC_SUPABASE_ANON_KEY: 'synthetic-public-key' } : {} },
    ...(hostname === undefined ? {} : { window: { location: { hostname } } }),
  });
  return { ...result, created };
}

test('AC-01 local default never constructs Supabase even with keys', () => {
  assert.equal(client().supabase, null);
  assert.equal(client({ keys: false }).supabase, null);
});
test('AC-03 Vercel remote constructs client only with keys', () => {
  assert.equal(client({ vercel: true, hostname: 'budget.example' }).created, 1);
  assert.equal(client({ vercel: true, hostname: 'budget.example', keys: false }).supabase, null);
});
test('AC-03 Vercel loopback always disables client', () => {
  for (const hostname of ['localhost', 'localhost.', 'app.localhost', 'APP.LOCALHOST.', '127.0.0.1', '127.12.34.56', '[::1]', '::1']) {
    assert.equal(client({ vercel: true, hostname }).supabase, null, hostname);
  }
});

test('AC-03 actual Expo config selects only Vercel remote builds, never vercel dev', async () => {
  const { createRequire } = await import('node:module');
  const config = createRequire(import.meta.url)('../app.config.js');
  const previous = { VERCEL: process.env.VERCEL, VERCEL_ENV: process.env.VERCEL_ENV, NODE_ENV: process.env.NODE_ENV };
  try {
    for (const [vercel, environment, nodeEnv, expected] of [
      ['', '', 'production', 'local'], ['1', 'production', 'production', 'supabase'],
      ['1', 'preview', 'production', 'supabase'], ['1', 'development', 'development', 'local'],
    ]) {
      process.env.VERCEL = vercel; process.env.VERCEL_ENV = environment; process.env.NODE_ENV = nodeEnv;
      assert.equal(config({ config: { extra: { preserved: true } } }).extra.storageMode, expected);
      assert.equal(config({ config: { extra: { preserved: true } } }).extra.preserved, true);
    }
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
