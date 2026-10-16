import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadTypeScript } from './helpers/load-typescript.mjs';

function auth(api) { return loadTypeScript('src/services/authService.ts', { './supabaseClient': { supabase: api ? { auth: api } : null } }); }

test('AC-S04 auth translates login/signup/logout errors without exposing backend messages', async () => {
  const service=auth({
    signInWithPassword:async()=>({data:{},error:{code:'invalid_credentials',message:'Invalid login credentials'}}),
    signUp:async()=>({data:{},error:{code:'user_already_exists',message:'User already registered'}}),
    signOut:async()=>({error:{message:'private backend detail'}}),
  });
  assert.match((await service.signIn('test@example.com','secret12')).error.message,/identifiants|mot de passe/i);
  assert.match((await service.signUp('test@example.com','secret12')).error.message,/compte|adresse/i);
  assert.match((await service.signOut()).error.message,/déconnexion/i);
  assert.doesNotMatch((await service.signOut()).error.message,/private|backend/i);
  const offline=auth({signInWithPassword:async()=>{throw Error('Failed to fetch');}});
  assert.match((await offline.signIn('test@example.com','secret12')).error.message,/connexion|réseau/i);
});

test('AC-S04 auth success, confirmation email, session subscription and local isolation', async () => {
  const user={id:'synthetic-user'};const session={user};let unsubscribed=false;
  const service=auth({
    signInWithPassword:async()=>({data:{user,session},error:null}),
    signUp:async()=>({data:{user,session:null},error:null}),
    signOut:async()=>({error:null}),getSession:async()=>({data:{session},error:null}),
    onAuthStateChange(callback){callback('SIGNED_IN',session);return {data:{subscription:{unsubscribe(){unsubscribed=true;}}}};},
  });
  assert.equal((await service.signIn('test@example.com','secret12')).user.id,user.id);
  assert.equal((await service.signUp('test@example.com','secret12')).session,null);
  assert.equal((await service.getSession()).user.id,user.id);
  let event;service.onAuthStateChange((_s,_u,e)=>{event=e;}).unsubscribe();
  assert.equal(event,'SIGNED_IN');assert.equal(unsubscribed,true);
  assert.equal((await service.signOut()).error,null);
  const local=auth(null);
  assert.match((await local.signIn('test@example.com','secret12')).error.message,/configur/);
  assert.equal(await local.getSession(),null);assert.equal(await local.getCurrentUser(),null);
});

test('AC-S04/05 unique typed client uses explicit public schema and URL callback only on web', () => {
  for(const os of ['web','ios']) {
    let options;
    loadTypeScript('src/services/supabaseClient.ts',{
      '../config/supabase':{isSupabaseConfigured:true,supabaseUrl:'https://synthetic.supabase.invalid',supabaseAnonKey:'public-key'},
      '../config/storageMode':{isLocalMode:false},
      'react-native':{Platform:{OS:os}},
      '@react-native-async-storage/async-storage':{},
      '@supabase/supabase-js':{createClient(_url,_key,config){options=config;return {}; }},
    });
    assert.equal(options.db.schema,'public');
    assert.equal(options.db.retry,false);
    assert.equal(options.db.timeout,10000);
    assert.equal(options.auth.detectSessionInUrl,os==='web');
    assert.equal(options.auth.persistSession,true);
  }
});
