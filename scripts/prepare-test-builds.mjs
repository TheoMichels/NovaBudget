import { spawnSync } from 'node:child_process';

// Aucune variable locale ni donnée distante dans les bundles de tests.
for (const [name, vercel, keys] of [ ['local', '', true], ['cloud', '1', true], ['cloud-unconfigured', '1', false] ]) {
  const env = { ...process.env, EXPO_NO_DOTENV: '1', EXPO_NO_TELEMETRY: '1', VERCEL: vercel, VERCEL_ENV: 'preview',
    EXPO_PUBLIC_SUPABASE_URL: keys ? 'https://synthetic.supabase.invalid' : '',
    EXPO_PUBLIC_SUPABASE_ANON_KEY: keys ? 'synthetic-public-key-for-tests' : '',
  };
  const result = spawnSync(process.execPath, ['node_modules/expo/bin/cli', 'export', '-p', 'web', '--clear', '--output-dir', `.agents/state/test-builds/${name}`], { env, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
