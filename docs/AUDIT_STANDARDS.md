# 📋 Rapport d'Audit de Conformité aux Standards — NovaBudget

**Date de l'audit** : 15 Octobre 2026  
**Périmètre** : Codebase NovaBudget (`/Users/theomichels/App/NovaBudget`)  
**Référentiel audité** : 
- Constitution Globale Antigravity (`RULE[user_global]`)
- Règles spécifiques NovaBudget (`./AGENTS.md`)
- Règles de sécurité & secrets (`security-secrets.md`)
- Règles de qualité TypeScript & Conventions Git (`git-conventions.md`)
- Skills associés (`autonomous-qa`, `test-architect`, `project-bootstrap`, `ui-ux-designer`)

---

## 🚦 Synthèse Exécutive

| Domaine | Statut | Niveau de sévérité | Principaux constats |
|---|---|---|---|
| **1. Harness & Scripts CI/QA** | 🔴 Non conforme | **Bloquant** | `verify-harness.sh --strict` échoue : scripts `lint` et `test:e2e` absents. `.agents/harness.config` manquant. |
| **2. Source de Vérité Base & Schéma** | 🟠 Écart majeur | **Élevé** | Double source de vérité concurrente (Prisma + Supabase SQL). Prisma client installé mais non utilisé en runtime. |
| **3. Validation des Données (`zod`)** | 🔴 Non conforme | **Élevé** | `zod` est totalement absent du projet (entrées formulaires, parsing AsyncStorage et Supabase non typés à l'exécution). |
| **4. Architecture de Tests (Unit & E2E)** | 🔴 Non conforme | **Élevé** | Absence de `jest-expo` et Playwright. Un seul fichier `node:test` isolé. Script QA contenant des données hardcodées. |
| **5. Dette Technique & Code Mort** | 🟠 Écart majeur | **Moyen** | **4 197 lignes de code mort** (12 composants obsolètes non importés suite à l'unification de l'interface). |
| **6. Typage TypeScript & Qualité** | 🟡 Écart mineur | **Moyen** | Présence de `any` explicites (`isTableMissingError`), casts `as any` sur styles web, hook `useForecast` orphelin. |
| **7. Design System & Tokens** | 🟡 Écart mineur | **Moyen** | 138 couleurs hexadécimales codées en dur dans les composants au lieu d'utiliser `src/theme/colors.ts`. |
| **8. Robustesse UI & Contrat des 4 États** | 🟠 Écart majeur | **Élevé** | États `loading` et `error` des hooks ignorés dans `App.tsx`. Couverture `testID` quasi inexistante (< 10%). |
| **9. Sécurité, Secrets & Git** | 🟢 Conforme (avec réserves) | **Faible** | Bon respect de la RLS Supabase et de l'isolation des secrets. `.agents/state/` absent du `.gitignore`. |

---

## 🔍 Analyse Détaillée des Écarts

---

### 1. Harness de Vérification & Scripts Projet

#### 📌 Règle / Standard attendu
- Le script `verify-harness.sh --strict` doit passer à 100% avec les 5 étapes : `typecheck` ➔ `lint` ➔ `unit` ➔ `build` ➔ `e2e`.
- `.agents/harness.config` doit être présent à la racine pour orchestrer ou justifier les étapes sautées (`SKIP_*`).
- `package.json` doit déclarer les scripts standards : `typecheck`, `lint`, `test`, `test:e2e`, `build`.

#### ❌ Constat d'écart
1. **Échec de `verify-harness.sh --strict`** :
   - `lint` : **MISSING** (aucun script `lint` dans `package.json`, `expo lint` non installé).
   - `e2e` : **MISSING** (aucun Playwright configuré).
2. **Scripts manquants dans `package.json`** :
   - Présents : `start`, `android`, `ios`, `web`, `build`, `test`, `postinstall`, `db:push`, `db:deploy`, `db:studio`.
   - Absents : `typecheck` (`tsc --noEmit`), `lint` (`expo lint`), `test:e2e` (`playwright test`).
3. **Fichiers de configuration manquants** :
   - Le dossier `.agents/` ne contenait aucun `.agents/harness.config`.
   - `.agents/state/` n'était pas listé dans `.gitignore`, polluant l'état Git lors des exécutions du harness.

---

### 2. Base de Données : Concurrence Prisma vs Supabase

#### 📌 Règle / Standard attendu
> *« Une seule source de vérité du schéma par projet (Prisma OU migrations Supabase, jamais les deux en concurrence). »* — Constitution Globale.

#### ❌ Constat d'écart
1. **Dualité non résolue** :
   - `prisma/schema.prisma` définit 5 modèles avec `@id @default(cuid())`.
   - `supabase/migrations/20261013000000_init_novabudget_schema.sql` définit les mêmes tables en SQL avec RLS, triggers et types Postgres natifs.
   - `AGENTS.md` section 3 mentionne encore : `<À CONFIRMER — supabase/migrations/ ou prisma/schema.prisma>`.
2. **Dépendance morte `@prisma/client`** :
   - `@prisma/client` et `prisma` sont installés, et `postinstall` exécute `prisma generate`.
   - Pourtant, **aucun fichier de `src/` n'importe Prisma** : l'accès aux données se fait exclusivement via `@supabase/supabase-js`.
   - `prisma` ne sert qu'à `prisma db push` / `prisma studio`.
3. **Duplication des types de données** :
   - `src/types/database.ts` redéfinit manuellement tous les types `Row`, `Insert` et `Update` au lieu de générer automatiquement les types Supabase via `supabase gen types typescript`.
4. **Duplication conceptuelle Métier** :
   - La table `expenses` et la table `future_projects` ont un schéma strictement identique.
   - Dans `App.tsx`, elles sont fusionnées arbitrairement dans `allPlannedExpenses` pour des raisons historiques de rétro-compatibilité.

---

### 3. Absence Totale de Validation à l'Exécution (`zod`)

#### 📌 Règle / Standard attendu
> *« Validation : zod pour toute entrée externe (formulaires, API, stockage local). »* — Constitution Globale.

#### ❌ Constat d'écart
1. `zod` n'est **ni installé** dans `package.json`, **ni utilisé** dans `src/`.
2. **Données non validées** :
   - Désérialisation du stockage local : `JSON.parse(AsyncStorage.getItem(...))` casté directement sans validation de schéma.
   - Réponses réseau Supabase : castées directement via `mapExpenseRowToExpense`, etc.
   - Formulaires d'ajout (`AddExpenseModal`, `AddSavingsModal`, `AddInflowModal`) : contrôles basiques sans validation formelle par schéma Zod.

---

### 4. Architecture de Tests & Outillage QA

#### 📌 Règle / Standard attendu
- Tests unitaires et d'intégration de composants avec `jest-expo` et `@testing-library/react-native`.
- Parcours E2E Playwright sur le build web avec garde-fous sur les erreurs console et vérification de la persistance au rechargement.
- Tests purs et déterministes, sans identifiants personnels ni chemins en dur.

#### ❌ Constat d'écart
1. **Tests unitaires actuels** :
   - `npm test` lance `node --test tests/*.test.mjs`.
   - Le seul fichier `tests/layoutStability.test.mjs` redéfinit ses propres fonctions `formatEuro` et `getGainsPillData` en pur JS, sans tester les composants ni les modules réels de l'application.
   - Ni `jest`, ni `jest-expo`, ni `@testing-library` ne sont installés.
2. **Tests E2E absents** :
   - Pas de `playwright.config.ts`, pas de dossier de tests E2E.
3. **Script QA legacy pollué (`scripts/qa-browser-inspect.mjs`)** :
   - Ligne 6 : Chemin d'artefact en dur d'une ancienne conversation (`/Users/theomichels/.gemini/antigravity/brain/7a13d5bd-c5f2-4ae1-8dc3-a7beb82c5ae1`).
   - Ligne 10 & 30 : Adresse email personnelle codée en dur (`michelstheo1@gmail.com`).
   - Ligne 166 : Clé de stockage Supabase locale codée en dur (`sb-skzehjvqvdbxfehbrgzu-auth-token`).

---

### 5. Dette Technique : 4 197 Lignes de Code Mort

#### 📌 Règle / Standard attendu
- Pas de code orphelin, pas de duplication, modularité nette.

#### ❌ Constat d'écart
Lors de la refonte vers un tableau de bord unifié (`UnifiedEvolutionChart`, `UnifiedManagementSections`, `UnifiedKpiCards`), les anciens écrans et sections modulaires n'ont pas été supprimés et encombrent la codebase :

| Fichier orphelin | Lignes de code | Statut d'import |
|---|---|---|
| `src/components/MetricCards.tsx` | 317 | Jamais importé |
| `src/components/SimulatorWaterfall.tsx` | 605 | Jamais importé |
| `src/components/ExpensesSection.tsx` | 550 | Jamais importé |
| `src/components/SavingsSection.tsx` | 459 | Jamais importé |
| `src/components/projections/ProjectionsTab.tsx` | 148 | Jamais importé |
| `src/components/projections/AddProjectModal.tsx` | 256 | Importé uniquement par `ProjectionsTab` |
| `src/components/projections/FutureProjectsSection.tsx` | 352 | Importé uniquement par `ProjectionsTab` |
| `src/components/projections/InflowsSection.tsx` | 256 | Importé uniquement par `ProjectionsTab` |
| `src/components/projections/MonthlySavingsController.tsx` | 245 | Importé uniquement par `ProjectionsTab` |
| `src/components/projections/ProjectionChart.tsx` | 547 | Importé uniquement par `ProjectionsTab` |
| `src/components/projections/ProjectionKpiCards.tsx` | 418 | Importé uniquement par `ProjectionsTab` |
| `src/components/projections/SmartRecommendationCard.tsx` | 84 | Importé uniquement par `ProjectionsTab` |
| **Total code mort** | **4 197 lignes** | **12 composants complètement obsolètes** |

De plus, dans `src/hooks/useForecast.ts` : le hook `useForecast(...)` lui-même n'est appelé nulle part. Seule la fonction utilitaire `formatEuro` y est piochée.

---

### 6. Typage TypeScript & Qualité de Code

#### 📌 Règle / Standard attendu
> *« strict: true. Pas de any (implicite ou explicite), pas de @ts-ignore ni de @ts-expect-error sans commentaire justificatif. »* — Règle Qualité TypeScript.

#### ❌ Constat d'écart
1. **Usage de `: any`** :
   - `function isTableMissingError(error: any): boolean` présent à l'identique dans 4 fichiers :
     - `src/storage/expenseRepository.ts:56`
     - `src/storage/projectionRepository.ts:63`
     - `src/storage/savingsRepository.ts:57`
     - `src/services/syncService.ts:30`
   - Devrait être typé en `error: unknown`.
2. **Usage de `as any` pour les styles React Native Web** :
   - `...({ backdropFilter: "blur(6px)" } as any)` présent dans :
     - `src/components/AddSavingsModal.tsx:296`
     - `src/components/AddExpenseModal.tsx:248`
     - `src/components/projections/AddInflowModal.tsx:206`
     - `src/components/projections/AddProjectModal.tsx:246`
     - `src/components/projections/ProjectionChart.tsx:430`
     - `src/theme/webCursor.ts:4`
   - Recommandation : étendre le typage `ViewStyle` ou utiliser un helper typé `as unknown as ViewStyle`.
3. **Localisation des utilitaires** :
   - `formatEuro` est défini dans un fichier de hook (`src/hooks/useForecast.ts`) au lieu d'un module utilitaire dédié (`src/utils/formatUtils.ts` ou `currencyUtils.ts`).

---

### 7. Design Tokens & Cohérence Visuelle

#### 📌 Règle / Standard attendu
- Centralisation stricte des styles et couleurs dans `src/theme/colors.ts`.
- Pas de valeurs de couleur arbitraires disséminées dans les composants.

#### ❌ Constat d'écart
1. **138 occurrences de couleurs hexadécimales brutes** dans `src/components/` :
   - Exemples : `#92400E`, `#34D399`, `#FBBF24`, `#78350F`, `#0D9488`, `#FFFFFF`, `#F59E0B`.
2. **Divergence mineure dans les tokens** :
   - `AGENTS.md` préconise pour les alertes/dépenses l'ambre `#F59E0B`.
   - `src/theme/colors.ts` déclare `warning: "#D97706"`.

---

### 8. Robustesse UI & Contrat des 4 États

#### 📌 Règle / Standard attendu
- Gestion des 4 états d'interface : **Chargement (Loading)**, **Vide (Empty)**, **Succès/Normal**, **Erreur**.
- Tous les éléments interactifs et conteneurs d'indicateurs doivent porter un `testID` (kebab-case).

#### ❌ Constat d'écart
1. **États d'erreur et de chargement ignorés au premier niveau** :
   - Dans `App.tsx` (`AuthenticatedDashboard`), les retours `{ loading, error }` de `useSavings()`, `useExpenses()` et `useProjections()` ne sont pas récupérés.
   - En cas d'erreur de chargement Supabase ou AsyncStorage, l'utilisateur voit un tableau de bord à 0 € sans notification ni message d'erreur français explicite.
2. **Déficit d'identifiants de test (`testID`)** :
   - Seuls `UnifiedEvolutionChart.tsx` et `UnifiedKpiCards.tsx` définissent des `testID`.
   - Tous les boutons d'action (ajout, suppression, bascule actif/inactif), les formulaires des modals, le calendrier et les cartes de gestion n'ont aucun `testID`.

---

### 9. Sécurité, Secrets & Bonnes Pratiques Git

#### 📌 Règle / Standard attendu
- Aucun secret dans le bundle web, RLS active sur toutes les tables.
- `.agents/state/`, `.env*` dans `.gitignore`.
- Commits respectant la convention Conventional Commits.

#### 🟢 Points forts
- Le bundle web exporté (`dist/`) ne contient aucun secret serveur (`SUPABASE_SERVICE_ROLE_KEY` n'est pas embarqué).
- RLS activée avec politiques strictes `auth.uid() = user_id` sur toutes les tables SQL.
- AsyncStorage est bien confiné dans les repositories (`src/storage/`).

#### ❌ Écarts constatés
- `.agents/state/` n'était pas dans `.gitignore`.
- Historique Git : commit `54e4c78` intitulé `fix design` (non conforme à Conventional Commits).

---

## 🛠️ Plan d'Action Recommandé

Pour aligner NovaBudget avec l'ensemble des standards, voici la feuille de route préconisée :

### Étape 1 : Nettoyage du Code Mort & Normalisation (Gain immédiat de lisibilité)
1. Supprimer les 12 composants orphelins (~4 200 lignes) : `MetricCards`, `SimulatorWaterfall`, `ExpensesSection`, `SavingsSection`, et l'intégralité du dossier `src/components/projections/` (à l'exception de `AddInflowModal.tsx`).
2. Déplacer `formatEuro` dans `src/utils/currencyUtils.ts` et supprimer le fichier hook obsolète `src/hooks/useForecast.ts`.
3. Remplacer `error: any` par `error: unknown` dans les 4 fonctions `isTableMissingError`.

### Étape 2 : Unification de la Source de Vérité Base de Données
1. Confirmer **Supabase Migrations SQL** comme unique source de vérité (gestion native des RLS, triggers et index).
2. Supprimer la dépendance `@prisma/client`, `prisma`, et le dossier `prisma/`.
3. Mettre à jour `AGENTS.md` pour acter ce choix.
4. Mettre en place un script `npm run db:types` générant automatiquement `src/types/database.ts` depuis Supabase.

### Étape 3 : Bootstrap de l'Outillage Harness & Tests
1. Configurer `.agents/harness.config` et ajouter `.agents/state/` dans `.gitignore`.
2. Ajouter les scripts standards dans `package.json` :
   - `"typecheck": "tsc --noEmit"`
   - `"lint": "expo lint"`
   - `"test": "jest"` (installation de `jest-expo`)
   - `"test:e2e": "playwright test"` (installation minimale Playwright sur `dist/`)
3. Rendre `verify-harness.sh --strict` 100% vert.

### Étape 4 : Validation `zod` & Contrat des 4 États
1. Installer `zod` et valider les modèles au niveau des repositories et formulaires de saisie.
2. Intégrer les états `loading` et `error` dans `App.tsx` (bannière d'alerte en cas de panne réseau ou synchronisation).
3. Poser des `testID` kebab-case sur l'ensemble des boutons interactifs et champs de formulaire.
