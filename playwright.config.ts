import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  reporter: 'list',
  use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 }, baseURL: 'http://localhost:4173', trace: 'retain-on-failure' },
  webServer: [
    { command: 'npx serve .agents/state/test-builds/local -l 4173', url: 'http://localhost:4173', reuseExistingServer: false },
    { command: 'npx serve .agents/state/test-builds/cloud -l 4174', url: 'http://localhost:4174', reuseExistingServer: false },
    { command: 'npx serve .agents/state/test-builds/cloud-unconfigured -l 4175', url: 'http://localhost:4175', reuseExistingServer: false },
  ],
});
