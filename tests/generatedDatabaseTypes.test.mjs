import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { generateDatabaseTypes } from '../scripts/generate-db-types.mjs';

test('AC-S05 generated novabudget contract retains MCP provenance and derived aliases',()=>{
  const current=fs.readFileSync('src/types/database.ts','utf8');
  const generated=current.slice(current.indexOf('export type Json'),current.indexOf('// Alias dérivés'));
  assert.equal(crypto.createHash('sha256').update(generated).digest('hex'),'95ae2ade0fb6ae5a02cb386591286299cb528bbc85d997d62043b551934eac62');
  assert.match(current,/MCP Supabase.*skzehjvqvdbxfehbrgzu.*novabudget.*16\/10\/2026/);
  assert.match(current,/id: string/);
  assert.match(current,/type ExpenseInsert = Database\["novabudget"\]\["Tables"\]\["expenses"\]\["Insert"\]/);
});
test('AC-S05 generator introspects only an explicit schema, preserves old file on failure and derives aliases',()=>{
  const source=fs.readFileSync('src/types/database.ts','utf8');let written,calls=[];
  const run=(...args)=>{calls.push(args);return {status:0,stdout:source.slice(source.indexOf('export type Json'),source.indexOf('// Alias dérivés'))};};
  const args=['--project-id','skzehjvqvdbxfehbrgzu','--schema','novabudget'];
  generateDatabaseTypes(args,run,content=>{written=content;});
  assert.deepEqual(calls[0][1],['gen','types','typescript',...args]);
  assert.equal(calls[0][2].shell,false);
  assert.match(written,/type SavingsAccountRow = Database/);
  assert.throws(()=>generateDatabaseTypes(['--project-id',args[1]],run),/Usage/);
  assert.throws(()=>generateDatabaseTypes(args,()=>({status:1,stdout:'private backend error'}),()=>assert.fail('Failed generation must never write')),/fichier existant conservé/);
  assert.throws(()=>generateDatabaseTypes(['--project-id',args[1],'--schema','auth'],run),/Usage/);
});
