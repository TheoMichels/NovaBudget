import { test as base, expect } from '@playwright/test';

/**
 * Console guard — automatically attached to every test.
 * Collects console errors, uncaught page errors and 5xx responses,
 * then fails the test at teardown if anything was captured.
 * Add known, harmless messages to IGNORED (regex) — sparingly.
 */
const IGNORED: RegExp[] = [
  /Download the React DevTools/i,
];

type Fixtures = { consoleGuard: void; expectedOfflineSupabase: boolean };

export const test = base.extend<Fixtures>({
  expectedOfflineSupabase: [false, { option: true }],
  consoleGuard: [
    async ({ page, expectedOfflineSupabase }, use) => {
      const errors: string[] = [];
      page.on('console', (msg) => {
        const expectedTransportFailure = expectedOfflineSupabase && /net::ERR_INTERNET_DISCONNECTED/.test(msg.text()) &&
          /^https:\/\/synthetic\.supabase\.invalid\/rest\/v1\//.test(msg.location().url);
        if (msg.type() === 'error' && !expectedTransportFailure && !IGNORED.some((r) => r.test(msg.text()))) {
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
    { auto: true },
  ],
});

export { expect };
