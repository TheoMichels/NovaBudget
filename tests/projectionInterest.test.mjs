import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadTypeScript } from './helpers/load-typescript.mjs';

function projectAt(date, horizonMonths) {
  class FixedDate extends Date {
    constructor(...args) {
      super(...(args.length ? args : [date]));
    }
  }
  const { useProjectionEngine } = loadTypeScript('src/hooks/useProjectionEngine.ts', {
    react: { useMemo: calculate => calculate() },
  }, { Date: FixedDate });
  return useProjectionEngine(
    [{ id: 's1', name: 'Épargne', category: 'savings', amount: 1000, rate: 12, updatedAt: '' }],
    [],
    [],
    { monthlyTotal: 100 },
    horizonMonths,
    0,
  );
}

test('interest accrues monthly, is credited in January, and earns interest in later years', () => {
  const result = projectAt('2026-01-15T12:00:00.000Z', 24);

  assert.equal(result.weightedAnnualRate, 12);
  assert.equal(result.monthlyData[1].capital, 1100);
  assert.equal(result.monthlyData[1].interestEarnedThisMonth, 11);
  assert.equal(result.monthlyData[2].capital, 1200);
  assert.equal(result.monthlyData[12].dateStr, '2027-01');
  assert.equal(result.monthlyData[12].capital, 2386);
  assert.equal(result.monthlyData[12].interestEarnedThisMonth, 24);
  assert.equal(result.monthlyData[12].accumulatedInterest, 210);
  assert.equal(result.monthlyData[23].capital, 3486);
  assert.equal(result.monthlyData[24].dateStr, '2028-01');
  assert.equal(result.monthlyData[24].capital, 3938);
  assert.equal(result.monthlyData[24].accumulatedInterest, 578);
});

test('elapsed months in the current year accrue on initial capital before projected growth', () => {
  const result = projectAt('2026-10-15T12:00:00.000Z', 3);

  assert.equal(result.monthlyData[0].accumulatedInterest, 100);
  assert.equal(result.monthlyData[1].dateStr, '2026-11');
  assert.equal(result.monthlyData[1].capital, 1100);
  assert.equal(result.monthlyData[1].accumulatedInterest, 111);
  assert.equal(result.monthlyData[2].capital, 1200);
  assert.equal(result.monthlyData[2].accumulatedInterest, 123);
  assert.equal(result.monthlyData[3].dateStr, '2027-01');
  assert.equal(result.monthlyData[3].capital, 1423);
});
