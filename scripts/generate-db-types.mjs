import { spawnSync } from 'node:child_process';
import { writeFileSync, renameSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const tables = { SavingsAccount: 'savings_accounts', Expense: 'expenses', FutureProject: 'future_projects', Inflow: 'inflows', UserSettings: 'user_settings' };
export function generatedAliases(schema) {
  return '\n// Alias dérivés du contrat généré ; aucun champ métier redéfini manuellement.\n' +
    Object.entries(tables).flatMap(([entity, table]) => ['Row', 'Insert', 'Update'].map(kind =>
      `export type ${entity}${kind} = Database["${schema}"]["Tables"]["${table}"]["${kind}"];`)).join('\n') + '\n';
}
// Introspection du schéma uniquement : aucune lecture des lignes ni commande de migration.
export function generateDatabaseTypes(args, run = spawnSync, save = (content) => {
  const target = path.join(root, 'src/types/database.ts');
  const temporary = `${target}.tmp`;
  writeFileSync(temporary, content);
  renameSync(temporary, target);
}) {
  const options = Object.fromEntries(args.reduce((pairs, value, index) => index % 2 === 0 ? [...pairs, [value, args[index + 1]]] : pairs, []));
  const project = options['--project-id'];
  const schema = options['--schema'];
  if (args.length !== 4 || !/^[a-z0-9]{20}$/.test(project ?? '') || !['public', 'novabudget', 'nova'].includes(schema)) {
    throw new Error('Usage : node scripts/generate-db-types.mjs --project-id <référence> --schema public|novabudget|nova');
  }
  const result = run('supabase', ['gen', 'types', 'typescript', '--project-id', project, '--schema', schema], { cwd: root, encoding: 'utf8', shell: false, maxBuffer: 5 * 1024 * 1024 });
  if (result.error || result.status !== 0 || typeof result.stdout !== 'string' ||
    !result.stdout.includes('export type Database') || !Object.values(tables).every(table => result.stdout.includes(`${table}:`))) {
    throw new Error('Génération des types impossible. Vérifiez la CLI Supabase, son accès et le schéma demandé ; fichier existant conservé.');
  }
  save(`// Généré par Supabase CLI, projet ${project}, schéma ${schema}, ${new Date().toISOString().slice(0, 10)}.\n` +
    '// Régénération (lecture seule) : node scripts/generate-db-types.mjs --project-id <ref> --schema ' + schema + '\n' + result.stdout + generatedAliases(schema));
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { generateDatabaseTypes(process.argv.slice(2)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
