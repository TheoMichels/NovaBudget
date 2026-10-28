import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadTypeScript } from './helpers/load-typescript.mjs';

test('new projection config defaults to zero and explicit increments are visible before persistence completes', async () => {
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
  assert.equal(hook.monthlyConfig.monthlyTotal, 0);
  const first = hook.updateMonthlyTotal(hook.monthlyConfig.monthlyTotal + 100);
  hook = render();
  assert.equal(hook.monthlyConfig.monthlyTotal, 100);
  const second = hook.updateMonthlyTotal(hook.monthlyConfig.monthlyTotal + 100);
  assert.equal(render().monthlyConfig.monthlyTotal, 200);
  assert.deepEqual(pending.map(write => write.total), [100, 200]);
  for (const write of pending) write.resolve();
  await Promise.all([first, second]);
  assert.equal(render().monthlyConfig.monthlyTotal, 200);
});

test('an explicitly saved monthly contribution is loaded and retained', async () => {
  const states = [];
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
      getFutureProjects: async () => [],
      getInflows: async () => [],
      getMonthlyContribution: async () => ({ monthlyTotal: 1250 }),
      saveMonthlyContribution: async () => {},
    },
  });
  const render = () => { cursor = 0; return useProjections(); };
  const hook = render();
  assert.equal(hook.monthlyConfig.monthlyTotal, 0);
  await hook.reload();
  assert.equal(render().monthlyConfig.monthlyTotal, 1250);
});

test('zero monthly contribution leaves savings flat between January interest credits', () => {
  class FixedDate extends Date {
    constructor(...args) {
      super(...(args.length ? args : ['2026-10-15T12:00:00.000Z']));
    }
  }
  const { useProjectionEngine } = loadTypeScript('src/hooks/useProjectionEngine.ts', {
    react: { useMemo: calculate => calculate() },
  }, { Date: FixedDate });
  const result = useProjectionEngine(
    [{ id: 's1', name: 'Livret', category: 'savings', amount: 100000, rate: 12, updatedAt: '' }],
    [],
    [],
    { monthlyTotal: 0 },
    26,
    0,
  );

  assert.equal(result.monthlyData[0].capital, 100000);
  assert.equal(result.monthlyData[2].capital, 100000);
  assert.equal(result.monthlyData[3].dateStr, '2027-01');
  assert.equal(result.monthlyData[3].capital, 112000);
  assert.equal(result.monthlyData[14].dateStr, '2027-12');
  assert.equal(result.monthlyData[14].capital, 112000);
  assert.equal(result.monthlyData[15].dateStr, '2028-01');
  assert.equal(result.monthlyData[15].capital, 125440);
  assert.equal(result.monthlyData[26].dateStr, '2028-12');
  assert.equal(result.monthlyData[26].capital, 125440);
});
