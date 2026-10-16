import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadTypeScript } from './helpers/load-typescript.mjs';

function repository(file, seed = new Map(), cloud = null) {
  const mocks = {
    '@react-native-async-storage/async-storage': { getItem: async k => seed.get(k) ?? null, setItem: async (k, v) => seed.set(k, v) },
    '../services/supabaseClient': { supabase: cloud },
    '../services/authService': { getCurrentUser: async () => null },
  };
  return loadTypeScript(file, mocks);
}
const account = { id: 'old', name: 'Historique', amount: 100, rate: 0, category: 'securite' };
test('AC-02 corrupted storage rejects reads and writes without changing original bytes', async () => {
  for (const value of ['{', '{}', '[{"amount":"100"}]']) {
    const seed = new Map([['@novabudget_savings_v3', value]]);
    const repo = repository('src/storage/savingsRepository.ts', seed);
    await assert.rejects(repo.getSavings(), /Données locales/);
    await assert.rejects(repo.saveSavings([account]), /Données locales/);
    assert.equal(seed.get('@novabudget_savings_v3'), value);
  }
});
test('AC-02 legacy records without updatedAt remain readable', async () => {
  const seed = new Map([['@novabudget_savings_v3', JSON.stringify([account])]]);
  assert.equal((await repository('src/storage/savingsRepository.ts', seed).getSavings())[0].amount, 100);
});
test('AC-03 invalid numeric and form inputs are rejected before persistence', async () => {
  const seed = new Map();
  const repo = repository('src/storage/savingsRepository.ts', seed);
  for (const amount of [NaN, Infinity, -10, '100']) await assert.rejects(repo.addSavings({ ...account, amount }), /Valeurs invalides/);
  assert.equal(seed.size, 0);
});
test('AC-02 settings reject malformed values without overwriting them', async () => {
  const seed = new Map([['@novabudget_safety_cushion_v3', 'broken']]);
  const repo = repository('src/storage/settingsRepository.ts', seed);
  await assert.rejects(repo.getSafetyCushion(), /Données locales/);
  await assert.rejects(repo.saveSafetyCushion(200), /Données locales/);
  assert.equal(seed.get('@novabudget_safety_cushion_v3'), 'broken');
});
test('AC-02 all collection keys and monthly settings preserve invalid bytes', async () => {
  for (const [file, key, read, write, value] of [
    ['expenseRepository', 'expenses', 'getExpenses', 'saveExpenses', []],
    ['projectionRepository', 'future_projects', 'getFutureProjects', 'saveFutureProjects', []],
    ['projectionRepository', 'inflows', 'getInflows', 'saveInflows', []],
    ['projectionRepository', 'monthly_contribution', 'getMonthlyContribution', 'saveMonthlyContribution', { monthlyTotal: 800 }],
  ]) {
    const storageKey = `@novabudget_${key}_v3`;
    const seed = new Map([[storageKey, '{']]);
    const repo = repository(`src/storage/${file}.ts`, seed);
    await assert.rejects(repo[read](), /Données locales/);
    await assert.rejects(repo[write](value), /Données locales/);
    assert.equal(seed.get(storageKey), '{');
  }
});
test('AC-03 invalid cloud response keeps the valid local cache', async () => {
  const raw = JSON.stringify([account]);
  const seed = new Map([['@novabudget_savings_v3', raw]]);
  const cloud = { from: () => ({ select: () => ({ eq: () => ({ order: async () => ({ data: [{ ...account, amount: 'broken' }] }) }) }) }) };
  const data = await repository('src/storage/savingsRepository.ts', seed, cloud).getSavings('test-user');
  assert.equal(data[0].amount, 100);
  assert.equal(seed.get('@novabudget_savings_v3'), raw);
});
test('AC-03 French number parser refuses partial numbers and accepts French spacing', () => {
  const { parseFrenchNumber } = loadTypeScript('src/types/validation.ts');
  assert.equal(parseFrenchNumber('1 250,50'), 1250.5);
  for (const value of ['12abc', '', 'Infinity', '1,2,3']) assert.ok(Number.isNaN(parseFrenchNumber(value)));
});
