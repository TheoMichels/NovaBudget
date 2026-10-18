import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { deployDatabase } from '../scripts/deploy-db.mjs';

const baseline = readFileSync('prisma/migrations/20261016000100_public_baseline/migration.sql', 'utf8');
const transferNovabudget = readFileSync('prisma/migrations/20261016000200_move_to_novabudget/migration.sql', 'utf8');
const transferNova = readFileSync('prisma/migrations/20261018000100_move_to_nova/migration.sql', 'utf8');
const tables = ['savings_accounts', 'expenses', 'future_projects', 'inflows', 'user_settings'];
const userA = '00000000-0000-4000-8000-000000000001';
const userB = '00000000-0000-4000-8000-000000000002';
const missingUser = '00000000-0000-4000-8000-000000000003';
async function database() {
  const db = new PGlite();
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth; CREATE TABLE auth.users (id uuid PRIMARY KEY);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
      $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    GRANT USAGE ON SCHEMA auth TO authenticated;
    INSERT INTO auth.users VALUES ('${userA}'), ('${userB}');`);
  return db;
}
function row(table, id, user) {
  const columns = table === 'user_settings' ? 'user_id' :
    table === 'savings_accounts' ? 'id,user_id,name,category,amount' :
      table === 'inflows' ? 'id,user_id,title,amount,target_date' : 'id,user_id,title,amount,target_date,category';
  const values = table === 'user_settings' ? `'${user}'` :
    table === 'savings_accounts' ? `'${id}','${user}','Compte','securite',42.50` :
      `'${id}','${user}','Titre',42.50,'2026-11-01'${table === 'inflows' ? '' : ",'projet'"}`;
  return `(${columns}) VALUES (${values})`;
}
async function snapshot(db, schema) {
  return Promise.all(tables.map(async table => [table, (await db.query(`SELECT * FROM ${schema}.${table} ORDER BY user_id`)).rows]));
}

test('AC-P02 deploy runner invokes only Prisma migrate deploy with direct connection and propagates failure', () => {
  const calls = [];
  const run = (...args) => { calls.push(args); return { status: 0 }; };
  const env = { DIRECT_URL: 'postgresql://direct.invalid/db', DATABASE_URL: 'postgresql://pool.invalid/db' };
  assert.equal(deployDatabase(env, run), 0);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0][1], ['migrate', 'deploy']);
  assert.equal(calls[0][2].env.DATABASE_URL, env.DIRECT_URL);
  assert.equal(calls[0][2].env.DIRECT_URL, env.DIRECT_URL);
  assert.equal(calls[0][2].shell, false);
  assert.equal(deployDatabase({ POSTGRES_URL_NON_POOLING: env.DIRECT_URL }, run), 0);
  assert.throws(() => deployDatabase({}, run), /DIRECT_URL/);
  assert.equal(deployDatabase(env, () => ({ status: 7 })), 7);
  assert.throws(() => deployDatabase(env, () => ({ error: new Error('spawn failed') })), /spawn failed/);
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.equal(pkg.scripts['db:push'], undefined);
});

test('AC-P01/P03 exact migrations preserve data, enforce CRUD ownership, grants, FK and hardened triggers', async () => {
  const db = await database();
  try {
    await db.exec(baseline);
    for (const table of tables) for (const [id,user] of [['a',userA],['b',userB]]) {
      await db.exec(`INSERT INTO public.${table} ${row(table,id,user)};`);
    }
    const before = await snapshot(db, 'public');
    const oids = (await db.query("SELECT oid FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relkind='r' ORDER BY relname")).rows;
    await db.exec(transferNovabudget);
    assert.deepEqual(await snapshot(db, 'novabudget'), before);
    assert.deepEqual((await db.query("SELECT oid FROM pg_class WHERE relnamespace = 'novabudget'::regnamespace AND relkind='r' ORDER BY relname")).rows, oids);

    await db.exec(transferNova);
    assert.deepEqual(await snapshot(db, 'nova'), before);
    assert.deepEqual((await db.query("SELECT oid FROM pg_class WHERE relnamespace = 'nova'::regnamespace AND relkind='r' ORDER BY relname")).rows, oids);

    for (const table of tables) {
      const policies = (await db.query('SELECT cmd,roles,qual,with_check FROM pg_policies WHERE schemaname=$1 AND tablename=$2 ORDER BY cmd', ['nova',table])).rows;
      assert.deepEqual(policies.map(p=>p.cmd), ['DELETE','INSERT','SELECT','UPDATE']);
      assert.ok(policies.every(p=>p.roles.length === 1 && p.roles[0] === 'authenticated'));
      assert.equal((await db.query(`SELECT relrowsecurity FROM pg_class WHERE oid='nova.${table}'::regclass`)).rows[0].relrowsecurity,true);
      for (const role of ['authenticated','service_role']) for (const privilege of ['SELECT','INSERT','UPDATE','DELETE']) {
        assert.equal((await db.query('SELECT has_table_privilege($1,$2,$3) AS allowed',[role,`nova.${table}`,privilege])).rows[0].allowed,true);
      }
      assert.equal((await db.query('SELECT has_table_privilege($1,$2,$3) AS allowed',['anon',`nova.${table}`,'SELECT'])).rows[0].allowed,false);
      await assert.rejects(db.exec(`INSERT INTO nova.${table} ${row(table,'missing',missingUser)}`), /foreign key/);
      await db.exec(`SET ROLE authenticated; SET request.jwt.claim.sub='${userA}';`);
      assert.deepEqual((await db.query(`SELECT user_id FROM nova.${table}`)).rows,[{ user_id: userA }]);
      await assert.rejects(db.exec(`INSERT INTO nova.${table} ${row(table,'foreign',userB)}`), /row-level security/);
      assert.equal((await db.query(`UPDATE nova.${table} SET updated_at='2000-01-01' WHERE user_id='${userB}' RETURNING *`)).rows.length,0);
      await assert.rejects(db.exec(`UPDATE nova.${table} SET user_id='${userB}' WHERE user_id='${userA}'`), /row-level security/);
      const updated = (await db.query(`UPDATE nova.${table} SET updated_at='2000-01-01' WHERE user_id='${userA}' RETURNING updated_at`)).rows[0];
      assert.ok(new Date(updated.updated_at).getFullYear() >= 2026);
      assert.equal((await db.query(`DELETE FROM nova.${table} WHERE user_id='${userB}' RETURNING *`)).rows.length,0);
      assert.equal((await db.query(`DELETE FROM nova.${table} WHERE user_id='${userA}' RETURNING *`)).rows.length,1);
      await db.exec(`INSERT INTO nova.${table} ${row(table,'own',userA)}; SET request.jwt.claim.sub='${userB}';`);
      assert.deepEqual((await db.query(`SELECT user_id FROM nova.${table}`)).rows,[{ user_id: userB }]);
      await db.exec('RESET ROLE');
    }
    const fn = (await db.query("SELECT proconfig,prosecdef FROM pg_proc WHERE oid='nova.set_updated_at()'::regprocedure")).rows[0];
    assert.deepEqual(fn.proconfig,['search_path=pg_catalog']);
    assert.equal(fn.prosecdef,false);
    await db.exec(`DELETE FROM auth.users WHERE id='${userB}'`);
    for (const table of tables) assert.equal((await db.query(`SELECT * FROM nova.${table} WHERE user_id='${userB}'`)).rows.length,0);
  } finally { await db.close(); }
});

test('AC-P03 collision rolls back every transfer; conforming historical baseline can be adopted without replay', async () => {
  const db = await database();
  try {
    // Existing installations mark the baseline as applied after comparison; they never replay it.
    await db.exec(readFileSync('supabase/migrations/20261013000000_init_novabudget_schema.sql','utf8'));
    await db.exec(`INSERT INTO public.inflows ${row('inflows','kept',userA)};
      CREATE SCHEMA novabudget; CREATE TABLE novabudget.inflows (collision text);`);
    const before = await snapshot(db,'public');
    await assert.rejects(db.exec(baseline), /already exists/);
    await db.exec('ROLLBACK');
    assert.deepEqual(await snapshot(db,'public'),before);
    await assert.rejects(db.exec(transferNovabudget), /already exists/);
    await db.exec('ROLLBACK');
    assert.deepEqual(await snapshot(db,'public'),before);
    assert.equal((await db.query("SELECT to_regclass('novabudget.savings_accounts') AS table_name")).rows[0].table_name,null);
    await db.exec('DROP TABLE novabudget.inflows');
    await db.exec(transferNovabudget);
    assert.deepEqual(await snapshot(db,'novabudget'),before);

    await db.exec(`CREATE SCHEMA nova; CREATE TABLE nova.inflows (collision text);`);
    await assert.rejects(db.exec(transferNova), /already exists/);
    await db.exec('ROLLBACK');
    assert.deepEqual(await snapshot(db,'novabudget'),before);
    assert.equal((await db.query("SELECT to_regclass('nova.savings_accounts') AS table_name")).rows[0].table_name,null);
    await db.exec('DROP TABLE nova.inflows');
    await db.exec(transferNova);
    assert.deepEqual(await snapshot(db,'nova'),before);
  } finally { await db.close(); }
});

async function structure(db) {
  const queries = [
    "SELECT table_name,column_name,data_type,udt_name,is_nullable,column_default,numeric_precision,numeric_scale FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name,ordinal_position",
    "SELECT c.relname,con.conname,pg_get_constraintdef(con.oid) AS definition FROM pg_constraint con JOIN pg_class c ON c.oid=con.conrelid WHERE c.relnamespace='public'::regnamespace ORDER BY c.relname,con.conname",
    "SELECT tablename,indexname,indexdef FROM pg_indexes WHERE schemaname='public' ORDER BY tablename,indexname",
    "SELECT tablename,policyname,cmd,roles,qual,with_check FROM pg_policies WHERE schemaname='public' ORDER BY tablename,policyname",
    "SELECT c.relname,t.tgname,pg_get_triggerdef(t.oid) AS definition FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid WHERE c.relnamespace='public'::regnamespace AND NOT t.tgisinternal ORDER BY c.relname,t.tgname",
  ];
  return Promise.all(queries.map(async sql => (await db.query(sql)).rows));
}

test('AC-P01/P03 baseline matches legacy columns, constraints, indexes, policies and triggers', async () => {
  const expected = await database();
  const actual = await database();
  try {
    await expected.exec(readFileSync('supabase/migrations/20261013000000_init_novabudget_schema.sql','utf8'));
    await actual.exec(baseline);
    assert.deepEqual(await structure(actual), await structure(expected));
  } finally { await expected.close(); await actual.close(); }
});
