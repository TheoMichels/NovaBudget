# 🚀 Guide de Déploiement Cloud & Base de Données — NovaBudget

Ce guide détaille l'initialisation de la base de données PostgreSQL sur **Supabase**, la configuration des variables d'environnement et le déploiement de l'application Web sur **Vercel**.

---

## 1. Initialisation de la Base de Données Supabase

### Étape 1.1 : Création du projet Supabase
1. Rendez-vous sur la console Supabase : [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Cliquez sur **New project**.
3. Choisissez une organisation, un nom de projet (ex. `NovaBudget`), un mot de passe sécurisé pour la base de données et une région proche de vos utilisateurs (ex. `eu-west-3` Paris ou `eu-central-1` Francfort).
4. Patientez pendant le provisionnement de l'instance PostgreSQL.

### Étape 1.2 : Exécution de la Migration SQL
1. Dans le menu latéral de Supabase, ouvrez la section **SQL Editor**.
2. Cliquez sur **New query** (ou `+`).
3. Ouvrez le fichier de migration :
   [`supabase/migrations/20261013000000_init_novabudget_schema.sql`](file:///Users/theomichels/App/NovaBudget/supabase/migrations/20261013000000_init_novabudget_schema.sql)
4. Copiez l'intégralité du contenu SQL et collez-le dans l'éditeur de requêtes Supabase.
5. Cliquez sur **Run** (ou `Cmd/Ctrl + Enter`).
6. Le message `Success. No rows returned` confirme l'exécution sans erreur.

---

## 2. Structure du Schéma Relationnel & Sécurité

### 📊 Tables créées
| Table | Description | Clé Primaire | Clé Étrangère |
| :--- | :--- | :--- | :--- |
| `savings_accounts` | Comptes & livrets d'épargne (sécurité, projets, investissements) | `id (TEXT)` | `user_id -> auth.users(id)` |
| `expenses` | Dépenses prévues ou planifiées | `id (TEXT)` | `user_id -> auth.users(id)` |
| `future_projects` | Projets d'épargne moyen/long terme pour la simulation | `id (TEXT)` | `user_id -> auth.users(id)` |
| `inflows` | Rentrées d'argent ponctuelles (primes, remboursements) | `id (TEXT)` | `user_id -> auth.users(id)` |
| `user_settings` | Paramètres généraux (épargne mensuelle par défaut, matelas de sécurité) | `user_id (UUID)` | `user_id -> auth.users(id)` |

### 🔒 Sécurité Row Level Security (RLS)
- **RLS activée** sur 100% des tables.
- Isolation absolue par utilisateur : `auth.uid() = user_id`.
- 4 politiques strictes par table :
  - `SELECT` : Seul le propriétaire peut lire ses données.
  - `INSERT` : Seul le propriétaire authentifié peut insérer ses enregistrements (`WITH CHECK (auth.uid() = user_id)`).
  - `UPDATE` : Seul le propriétaire peut modifier ses enregistrements (`USING` et `WITH CHECK`).
  - `DELETE` : Seul le propriétaire peut supprimer ses enregistrements.

### ⚡ Performance & Triggers
- **Index B-Tree** créés sur toutes les clés `user_id`, couples `(user_id, category)`, `(user_id, target_date)` et `(user_id, is_active)` pour des requêtes sub-milliseconde.
- **Triggers automatiques** : Fonction `update_updated_at_column()` branchée sur chaque table pour horodater chaque mise à jour (`updated_at = now()`).

---

## 3. Configuration des Variables d'Environnement

### 🔑 Récupération des clés API Supabase
1. Dans le tableau de bord Supabase, rendez-vous dans **Project Settings** (icône engrenage) > **API**.
2. Récupérez :
   - **Project URL** (ex. `https://xyzcompany.supabase.co`)
   - **Project API Keys** : La clé publique `anon` / `public`.

> [!WARNING]
> N'utilisez **JAMAIS** la clé `service_role` côté client Expo Web/Mobile. Seule la clé `anon` doit être exposée via `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

### 💻 Configuration en Local
1. Dupliquez le fichier exemple à la racine du projet :
   ```bash
   cp .env.example .env
   ```
2. Remplissez vos vraies valeurs dans `.env` :
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. Le fichier `.env` est déjà ignoré par Git pour prévenir toute fuite de secret.

---

## 4. Déploiement de l'Application sur Vercel

NovaBudget est pré-configuré pour un déploiement fluide sur Vercel grâce au fichier [`vercel.json`](file:///Users/theomichels/App/NovaBudget/vercel.json).

### Étape 4.1 : Importation du Projet sur Vercel
1. Rendez-vous sur [https://vercel.com/new](https://vercel.com/new).
2. Liez votre dépôt Git (GitHub, GitLab ou Bitbucket).
3. Lors de la configuration du projet :
   - **Framework Preset** : `Other` (le build est piloté par `expo export -p web`).
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist`
   - **Install Command** : `npm install`

### Étape 4.2 : Ajout des Variables d'Environnement sur Vercel
Dans la section **Environment Variables** du projet Vercel, ajoutez :
- `EXPO_PUBLIC_SUPABASE_URL` : URL de votre projet Supabase
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` : Clé API publique anon Supabase

Sélectionnez les environnements **Production**, **Preview** et **Development**.

### Étape 4.3 : Lancement du Déploiement
1. Cliquez sur **Deploy**.
2. Vercel compile l'application Expo Web (`dist/`) et déploie le bundle avec :
   - Redirection SPA (`/(.*)` -> `/index.html`) pour le routing client.
   - Cache immutable HTTP (`max-age=31536000, immutable`) sur les assets compilés JS/CSS/médias.

---

## 5. Validation et Tests

1. **Vérification TypeScript locale** :
   ```bash
   npx tsc --noEmit
   ```
2. **Build Web local** :
   ```bash
   npm run build
   ```
3. **Contrôle Supabase** :
   - Connectez-vous avec un utilisateur dans l'application.
   - Vérifiez dans **Table Editor** de Supabase que les enregistrements sont créés avec le `user_id` correspondant au compte connecté.
   - Testez qu'un autre utilisateur ne peut accéder qu'à ses propres données grâce aux politiques RLS.
