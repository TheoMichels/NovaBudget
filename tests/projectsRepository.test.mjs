import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadTypeScript } from './helpers/load-typescript.mjs';

test('AC-02 future projects CRUD uses existing local cache without user or cloud', async () => {
  const memory = new Map();
  const mocks = {
    '@react-native-async-storage/async-storage': {
      getItem: async key => memory.get(key) ?? null,
      setItem: async (key, value) => { memory.set(key, value); },
    },
    '../services/supabaseClient': { supabase: null },
    '../services/authService': { getCurrentUser: async () => { throw Error('No auth in local repository'); } },
  };
  const load = () => loadTypeScript('src/storage/projectionRepository.ts', mocks);
  const repo = load();
  const project = await repo.addFutureProject({ title: 'Projet local', amount: 450, targetDate: '2027-01-01', category: 'autre', isActive: true });
  assert.equal((await load().getFutureProjects())[0].id, project.id);
  await repo.updateFutureProject(project.id, { amount: 600 });
  assert.equal((await load().getFutureProjects())[0].amount, 600);
  await repo.deleteFutureProject(project.id);
  assert.equal((await load().getFutureProjects()).length, 0);
  assert.ok(memory.has('@novabudget_future_projects_v3'));
});
