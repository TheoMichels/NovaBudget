import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadTypeScript } from './helpers/load-typescript.mjs';

const keys = { savings_accounts:'@novabudget_savings_v3', expenses:'@novabudget_expenses_v3', future_projects:'@novabudget_future_projects_v3', inflows:'@novabudget_inflows_v3' };
const userId = 'synthetic-user';
const savings = { id:'sav-a', name:'Livret', category:'securite',amount:100,rate:2,updatedAt:'2026-10-16T12:00:00Z' };
const expense = { id:'exp-a',title:'Voyage',category:'voyage',amount:50,targetDate:'2027-01-01',isActive:true,updatedAt:'2026-10-16T12:00:00Z' };
const clone = value => JSON.parse(JSON.stringify(value));
const deferred = () => { let resolve; const promise = new Promise(r => { resolve=r; }); return { promise,resolve }; };
function setup({ local=false, initialMemory }={}) {
  const memory = initialMemory ?? new Map();
  const remote = Object.fromEntries([...Object.keys(keys),'user_settings'].map(t=>[t,[]]));
  const calls=[];
  let readGate=null, writeGate=null, nextError=null, readFailure=false;
  const client={ auth:{getSession:async()=>({data:{session:{user:{id:userId}}},error:null})},from(table) {
    let action='select',payload, single=false; const filters=[];
    const query={select(){return query;},eq(column,value){filters.push([column,value]);return query;},order(){return query;},maybeSingle(){single=true;return query;},
      upsert(value){action='upsert';payload=clone(value);return query;},
      delete(){action='delete';return query;},
      then(resolve,reject){return (async()=>{
        calls.push({table,action,payload});
        if (action==='select' && readFailure) return { data:null,error:{message:'network unavailable'} };
        const matches=row=>filters.every(([k,v])=>row[k]===v);
        const snapshot=clone(remote[table].filter(matches));
        if(action==='select' && readGate){const gate=readGate;readGate=null;await gate.promise;}
        if(action!=='select' && writeGate){const gate=writeGate;writeGate=null;await gate.promise;}
        if(nextError && action!=='select'){const error=nextError;nextError=null;return {data:null,error};}
        if(action==='upsert') for(const row of (Array.isArray(payload)?payload:[payload])) {
          const key=table==='user_settings'?'user_id':'id';
          const index=remote[table].findIndex(r=>r[key]===row[key]);
          const full={created_at:'2026-01-01T00:00:00Z',...remote[table][index],...row};
          if(index<0)remote[table].push(full);else remote[table][index]=full;
        }
        if(action==='delete')remote[table]=remote[table].filter(row=>!matches(row));
        return {data:action==='select'?(single?snapshot[0]??null:snapshot):null,error:null};
      })().then(resolve,reject);},
    };return query;
  }};
  const asyncStorageMock = {
    getItem: async (key) => memory.get(key) ?? null,
    setItem: async (key, value) => { memory.set(key, value); },
    removeItem: async (key) => { memory.delete(key); },
    multiRemove: async (keys) => { for (const key of keys) memory.delete(key); },
    getAllKeys: async () => Array.from(memory.keys()),
  };
  const app=loadTypeScript('tests/helpers/cloud-entry.ts',{
    '@react-native-async-storage/async-storage': asyncStorageMock,
    './supabaseClient':{supabase:local?null:client},
    '../services/supabaseClient':{supabase:local?null:client},
  });
  return { ...app,memory,remote,calls,
    failReads(){readFailure=true;},
    gateRead(){readGate=deferred();return readGate;},gateWrite(){writeGate=deferred();return writeGate;},failWrite(){nextError={message:'sensitive backend details'};},
  };
}
async function waitFor(predicate) { for(let i=0;i<100;i++){if(predicate())return;await new Promise(r=>setTimeout(r,1));}assert.fail('Expected async checkpoint'); }

test('AC-S01 all business mutations are owned by syncService; local repositories never authenticate or connect',async()=>{
  for(const file of fs.readdirSync('src/storage').filter(f=>f.endsWith('Repository.ts'))) {
    assert.doesNotMatch(fs.readFileSync(`src/storage/${file}`,'utf8'),/supabaseClient|\.from\(/);
  }
  const app=setup({local:true});
  const created=await app.projections.addFutureProject({...expense,id:undefined,updatedAt:undefined});
  assert.equal((await app.projections.getFutureProjects())[0].id,created.id);
  await app.projections.deleteFutureProject(created.id);
  assert.equal((await app.projections.getFutureProjects()).length,0);
  assert.equal(app.calls.length,0);
});

test('AC-S02 push reads cache only, pull is read-only and replaces all empty collections',async()=>{
  const app=setup(); app.memory.set(keys.savings_accounts,JSON.stringify([savings]));
  assert.equal((await app.sync.pushLocalToSupabase(userId)).success,true);
  assert.equal(app.calls.filter(c=>c.action==='select').length,0);
  assert.deepEqual(app.calls.filter(c=>c.action==='upsert').map(c=>c.table),['savings_accounts','user_settings']);
  for(const table of Object.keys(keys))app.remote[table]=[];
  app.memory.set(keys.expenses,JSON.stringify([expense]));
  app.calls.length=0;
  assert.equal((await app.sync.pullSupabaseToLocal(userId)).success,true);
  assert.equal(app.calls.length,5);
  assert.ok(app.calls.every(c=>c.action==='select'));
  for(const key of Object.values(keys))assert.deepEqual(JSON.parse(app.memory.get(key)),[]);
});

test('AC-S02 validation of entire push/pull precedes every write; invalid remote data preserves cache',async()=>{
  const app=setup();app.memory.set(keys.savings_accounts,JSON.stringify([savings]));
  app.memory.set(keys.expenses,JSON.stringify([{...expense,amount:-1}]));
  assert.equal((await app.sync.pushLocalToSupabase(userId)).success,false);
  assert.equal(app.calls.filter(c=>c.action!=='select').length,0);
  app.memory.set(keys.expenses,JSON.stringify([expense]));
  app.remote.expenses=[{id:'bad',user_id:userId,amount:-1}];
  const before=[...app.memory];
  assert.equal((await app.sync.pullSupabaseToLocal(userId)).success,false);
  assert.deepEqual([...app.memory],before);
  assert.ok(app.calls.every(c=>c.action==='select'));
});

test('AC-S03 delayed writes retain concurrent local edits and serialize cloud order without stale responses',async()=>{
  const app=setup(); app.memory.set(keys.savings_accounts,JSON.stringify([savings]));
  const gate=app.gateWrite();
  const first=app.savings.updateSavings(savings.id,{amount:200});
  await waitFor(()=>app.calls.length===1);
  const second=app.savings.updateSavings(savings.id,{name:'Nouveau nom'});
  await waitFor(()=>JSON.parse(app.memory.get(keys.savings_accounts))[0].name==='Nouveau nom');
  assert.equal(JSON.parse(app.memory.get(keys.savings_accounts))[0].amount,200);
  gate.resolve();await Promise.all([first,second]);
  assert.equal(app.remote.savings_accounts[0].amount,200);
  assert.equal(app.remote.savings_accounts[0].name,'Nouveau nom');
  assert.equal(JSON.parse(app.memory.get(keys.savings_accounts))[0].name,'Nouveau nom');
  const monthGate=app.gateWrite();
  const m1=app.projections.saveMonthlyContribution({monthlyTotal:900});
  await waitFor(()=>app.calls.length===3);
  const m2=app.projections.saveMonthlyContribution({monthlyTotal:1000});
  await waitFor(()=>JSON.parse(app.memory.get('@novabudget_monthly_contribution_v3')).monthlyTotal===1000);
  monthGate.resolve();await Promise.all([m1,m2]);
  assert.equal(app.remote.user_settings[0].monthly_savings,1000);
});

test('AC-S03 errors are controlled, cache survives, confirmed deletion cannot be resurrected by a stale read or push',async()=>{
  const app=setup();app.memory.set(keys.savings_accounts,JSON.stringify([savings]));
  app.failWrite();await assert.rejects(app.savings.updateSavings(savings.id,{amount:200}),/conserv|synchronis/i);
  assert.equal(JSON.parse(app.memory.get(keys.savings_accounts))[0].amount,200);
  app.remote.savings_accounts=[{...savings,user_id:userId,created_at:savings.updatedAt,updated_at:savings.updatedAt}];
  const gate=app.gateRead();const stale=app.savings.getSavings();
  await waitFor(()=>app.calls.some(c=>c.action==='select'));
  const deletion=app.savings.deleteSavings(savings.id);
  await waitFor(()=>JSON.parse(app.memory.get(keys.savings_accounts)).length===0);
  gate.resolve();await Promise.all([stale,deletion]);
  assert.deepEqual(app.remote.savings_accounts,[]);
  assert.deepEqual(JSON.parse(app.memory.get(keys.savings_accounts)),[]);
  await app.sync.pushLocalToSupabase(userId);
  assert.deepEqual(app.remote.savings_accounts,[]);
});

test('AC-S03 offline reload returns validated cached collections/settings with French feedback; corruption stays visible',async()=>{
  const memory=new Map([
    [keys.savings_accounts,JSON.stringify([savings])], [keys.expenses,JSON.stringify([expense])],
    [keys.future_projects,JSON.stringify([expense])], [keys.inflows,JSON.stringify([expense])],
    ['@novabudget_safety_cushion_v3','14500'],['@novabudget_monthly_contribution_v3','{"monthlyTotal":1234}'],
  ]);
  const app=setup({initialMemory:memory});app.failReads();
  assert.equal((await app.savings.getSavings())[0].amount,100);
  assert.equal((await app.expenses.getExpenses())[0].amount,50);
  assert.equal((await app.projections.getFutureProjects())[0].amount,50);
  assert.equal((await app.projections.getInflows())[0].amount,50);
  assert.equal(await app.settings.getSafetyCushion(),14500);
  assert.equal((await app.projections.getMonthlyContribution()).monthlyTotal,1234);
  for(const table of [...Object.keys(keys),'user_settings'])assert.match(app.sync.getCloudReadError(table),/cache local reste affiché/);
  memory.set(keys.savings_accounts,'{');
  await assert.rejects(app.savings.getSavings(),/Données locales/);
  assert.equal(memory.get(keys.savings_accounts),'{');
});

test('AC-S01/03 four cloud CRUD paths and partial settings preserve sibling values',async()=>{
  const app=setup();
  const paths=[
    [app.savings,'addSavings','getSavings','updateSavings','deleteSavings','savings_accounts',{name:'Livret',category:'securite',amount:10,rate:2}],
    [app.expenses,'addExpense','getExpenses','updateExpense','deleteExpense','expenses',expense],
    [app.projections,'addFutureProject','getFutureProjects','updateFutureProject','deleteFutureProject','future_projects',expense],
    [app.projections,'addInflow','getInflows','updateInflow','deleteInflow','inflows',expense],
  ];
  for(const [repo,add,get,update,remove,table,input] of paths){
    const item=await repo[add](input);
    assert.equal(app.remote[table].length,1);
    assert.equal((await repo[get]())[0].id,item.id);
    await repo[update](item.id,{amount:75});
    assert.equal(app.remote[table][0].amount,75);
    await repo[remove](item.id);
    assert.equal(app.remote[table].length,0);
    assert.equal((await repo[get]()).length,0);
  }
  await app.settings.saveSafetyCushion(18000);
  await app.projections.saveMonthlyContribution({monthlyTotal:1200});
  assert.equal(app.remote.user_settings[0].safety_cushion,18000);
  assert.equal(app.remote.user_settings[0].monthly_savings,1200);
});

test('AC-S02 nonempty pull decodes monetary strings and clears empty siblings without cloud writes',async()=>{
  const app=setup();app.memory.set(keys.expenses,JSON.stringify([expense]));
  app.remote.savings_accounts=[{...savings,user_id:userId,amount:'250.50',rate:'2.10',updated_at:savings.updatedAt}];
  app.remote.user_settings=[{user_id:userId,safety_cushion:'19000.50',monthly_savings:'950.25'}];
  assert.equal((await app.sync.pullSupabaseToLocal(userId)).success,true);
  assert.equal(JSON.parse(app.memory.get(keys.savings_accounts))[0].amount,250.5);
  assert.equal(JSON.parse(app.memory.get('@novabudget_monthly_contribution_v3')).monthlyTotal,950.25);
  assert.deepEqual(JSON.parse(app.memory.get(keys.expenses)),[]);
  assert.ok(app.calls.every(c=>c.action==='select'));
});

test('AC-S03 read dispatched after a local edit but before its cloud command cannot restore stale remote data',async()=>{
  const app=setup();app.memory.set(keys.savings_accounts,JSON.stringify([savings]));
  app.remote.savings_accounts=[{...savings,user_id:userId,updated_at:savings.updatedAt}];
  const edit=app.savings.updateSavings(savings.id,{amount:300});
  const read=app.savings.getSavings();
  await Promise.all([edit,read]);
  assert.equal(JSON.parse(app.memory.get(keys.savings_accounts))[0].amount,300);
  assert.equal(app.remote.savings_accounts[0].amount,300);
});

for(const operation of ['update','delete'])test(`AC-S03 failed ${operation} on A is not acknowledged by success on B or a later push`,async()=>{
  const app=setup();const second={...savings,id:'sav-b',name:'Compte B'};
  app.memory.set(keys.savings_accounts,JSON.stringify([savings,second]));
  app.remote.savings_accounts=[savings,second].map(item=>({...item,user_id:userId,updated_at:item.updatedAt}));
  app.failWrite();
  await assert.rejects(operation==='update'?app.savings.updateSavings(savings.id,{amount:200}):app.savings.deleteSavings(savings.id),/conserv/);
  await app.savings.updateSavings(second.id,{amount:300});
  const current=await app.savings.getSavings();
  assert.equal(current.find(item=>item.id===savings.id)?.amount,operation==='update'?200:undefined);
  assert.equal(current.find(item=>item.id===second.id).amount,300);
  assert.equal((await app.sync.pushLocalToSupabase(userId)).success,true);
  const afterPush=await app.savings.getSavings();
  assert.equal(afterPush.find(item=>item.id===savings.id)?.amount,operation==='update'?200:undefined);
  if(operation==='update')assert.equal(app.remote.savings_accounts.find(item=>item.id===savings.id).amount,200);
  else assert.equal(app.remote.savings_accounts.some(item=>item.id===savings.id),true);
});

test('AC-S05 clearLocalCache deletes all @novabudget_* keys including legacy versions from storage', async () => {
  const seed = new Map([
    ['@novabudget_savings_v3', JSON.stringify([savings])],
    ['@novabudget_savings_v2', 'legacy-savings-v2'],
    ['@novabudget_savings_v1', 'legacy-savings-v1'],
    ['@novabudget_expenses_v3', JSON.stringify([expense])],
    ['@novabudget_expenses_v1', 'legacy-expenses-v1'],
    ['@novabudget_future_projects_v3', JSON.stringify([expense])],
    ['@novabudget_inflows_v3', JSON.stringify([expense])],
    ['@novabudget_monthly_contribution_v3', '{"monthlyTotal":1000}'],
    ['@novabudget_monthly_contribution_v1', '{"monthlyTotal":500}'],
    ['@novabudget_safety_cushion_v3', '20000'],
    ['@novabudget_custom_key', 'custom-value'],
    ['other_app_key', 'keep-me'],
  ]);
  const app = setup({ initialMemory: seed });
  await app.sync.clearLocalCache();
  for (const [key] of seed) {
    if (key.startsWith('@novabudget')) {
      assert.equal(app.memory.has(key), false, `Key ${key} should have been cleared`);
    } else {
      assert.equal(app.memory.get(key), 'keep-me');
    }
  }
});

test('AC-S05 pullFromCloud loads data and readCloudCollection avoids immediate double fetch', async () => {
  const app = setup();
  app.remote.savings_accounts = [{ ...savings, user_id: userId, created_at: savings.updatedAt, updated_at: savings.updatedAt }];
  app.remote.user_settings = [{ user_id: userId, safety_cushion: 15000, monthly_savings: 750 }];
  const pullResult = await app.sync.pullFromCloud(userId);
  assert.equal(pullResult.success, true);
  const selectsAfterPull = app.calls.filter(c => c.action === 'select').length;
  assert.equal(selectsAfterPull, 5); // 4 collections + user_settings
  // Calling getSavings and getSafetyCushion right after should use fresh cache without new select calls
  const accounts = await app.savings.getSavings(userId);
  assert.equal(accounts.length, 1);
  assert.equal(accounts[0].id, savings.id);
  const cushion = await app.settings.getSafetyCushion(userId);
  assert.equal(cushion, 15000);
  const selectsAfterGet = app.calls.filter(c => c.action === 'select').length;
  assert.equal(selectsAfterGet, selectsAfterPull, 'readCloudCollection should not re-query after pullFromCloud');
});

