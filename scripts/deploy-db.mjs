import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { execSync } from 'child_process';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Charger le fichier .env si non présent dans process.env
const envPath = path.join(rootDir, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const connectionString = process.env.DIRECT_URL || process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ Erreur : Aucune variable DIRECT_URL ou DATABASE_URL trouvée dans l'environnement !");
  process.exit(1);
}

async function deploy() {
  console.log("🚀 Initialisation du déploiement de la base Supabase PostgreSQL...");
  const parsedUrl = new URL(connectionString);
  const client = new Client({
    host: parsedUrl.hostname,
    port: Number(parsedUrl.port) || 5432,
    user: decodeURIComponent(parsedUrl.username),
    password: decodeURIComponent(parsedUrl.password),
    database: parsedUrl.pathname.slice(1) || 'postgres',
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("✅ Connexion réussie à l'instance PostgreSQL Supabase !");

    // 1. Lire et exécuter les migrations SQL dans supabase/migrations
    const migrationsDir = path.join(rootDir, 'supabase', 'migrations');
    if (fs.existsSync(migrationsDir)) {
      const sqlFiles = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();

      for (const file of sqlFiles) {
        console.log(`\n📄 Exécution du script de migration : ${file}...`);
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf-8');

        await client.query(sql);
        console.log(`✅ Migration ${file} appliquée avec succès !`);
      }
    }

    // 2. Synchroniser les modèles Prisma
    console.log("\n📦 Synchronisation du client Prisma (prisma generate)...");
    try {
      execSync('npx prisma generate', { cwd: rootDir, stdio: 'inherit' });
      console.log("✅ Client Prisma généré avec succès !");
    } catch (prismaErr) {
      console.warn("⚠️ Attention lors de prisma generate :", prismaErr.message);
    }

    // 3. Rapport d'inspection des tables dans le schéma public
    console.log("\n🔍 Vérification des tables créées dans le schéma public :");
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log("📋 Tables présentes en production :");
    tablesRes.rows.forEach(r => console.log(`   - 🟢 ${r.table_name}`));

    // 4. Vérification de la Row Level Security (RLS)
    console.log("\n🔒 Statut Row Level Security (RLS) :");
    const rlsRes = await client.query(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename;
    `);
    rlsRes.rows.forEach(r => {
      console.log(`   - ${r.rowsecurity ? '🛡️ RLS ACTIVE' : '⚠️ RLS DÉSACTIVÉE'} : ${r.tablename}`);
    });

    console.log("\n🎉 Déploiement et synchronisation de la base Supabase terminés avec succès !");
  } catch (err) {
    console.error("❌ Erreur lors du déploiement de la base de données :", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

deploy();
