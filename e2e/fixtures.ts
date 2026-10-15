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

type Fixtures = { consoleGuard: void };

export const test = base.extend<Fixtures>({
  consoleGuard: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error' && !IGNORED.some((r) => r.test(msg.text()))) {
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
