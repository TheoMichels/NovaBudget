import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadTypeScript } from './helpers/load-typescript.mjs';

test('C2 public cloud configuration is independent from the Supabase client', () => {
  for (const [url, key, expected] of [
    [undefined, undefined, false],
    ['https://placeholder.supabase.co', 'public-key', false],
    ['https://synthetic.supabase.invalid', 'public-key', true],
  ]) {
    const config = loadTypeScript('src/config/supabase.ts', {}, {
      process: { env: { EXPO_PUBLIC_SUPABASE_URL: url, EXPO_PUBLIC_SUPABASE_ANON_KEY: key } },
    });
    assert.equal(config.isSupabaseConfigured, expected);
  }
});

test('C2 authentication screens do not import the Supabase client module', () => {
  for (const file of ['AuthScreen', 'AuthModal']) {
    const source = fs.readFileSync(`src/components/${file}.tsx`, 'utf8');
    assert.doesNotMatch(source, /from\s+["'][^"']*supabaseClient["']/);
  }
});
