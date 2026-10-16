import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadTypeScript } from './helpers/load-typescript.mjs';

test('AC-01 rapid monthly increments are visible before cloud persistence completes', async () => {
  const states = [];
  const pending = [];
  let cursor = 0;
  const { useProjections } = loadTypeScript('src/hooks/useProjections.ts', {
    react: {
      useState: initial => {
        const slot = cursor++;
        if (!(slot in states)) states[slot] = initial;
        return [states[slot], value => { states[slot] = typeof value === 'function' ? value(states[slot]) : value; }];
      },
      useCallback: callback => callback,
      useEffect: () => {},
      useRef: value => ({ current: value }),
    },
    '../config/storageMode': { isLocalMode: true },
    '../services/authService': {},
    '../services/syncService': { getCloudReadError: () => null },
    '../storage/projectionRepository': {
      saveMonthlyContribution: config => new Promise(resolve => { pending.push({ total: config.monthlyTotal, resolve }); }),
    },
  });
  const render = () => { cursor = 0; return useProjections(); };
  let hook = render();
  const first = hook.updateMonthlyTotal(hook.monthlyConfig.monthlyTotal + 100);
  hook = render();
  assert.equal(hook.monthlyConfig.monthlyTotal, 900);
  const second = hook.updateMonthlyTotal(hook.monthlyConfig.monthlyTotal + 100);
  assert.equal(render().monthlyConfig.monthlyTotal, 1000);
  assert.deepEqual(pending.map(write => write.total), [900, 1000]);
  for (const write of pending) write.resolve();
  await Promise.all([first, second]);
  assert.equal(render().monthlyConfig.monthlyTotal, 1000);
});
