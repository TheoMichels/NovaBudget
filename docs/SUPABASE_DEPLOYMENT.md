# Base Supabase — préparation locale et bascule L6

Prisma est la seule source cible : `prisma/schema.prisma` (`novabudget`/`auth`) et `prisma/migrations/`.
Le client cloud utilise encore `public` ; aucune bascule distante n’a été exécutée.
`supabase/migrations/20261013000000_init_novabudget_schema.sql` est une **archive historique immuable**, conservée jusqu’à L6 ; aucun runner ne l’exécute.

## Chaîne versionnée
| Migration | Effet |
|---|---|
| `20261016000100_public_baseline` | Reproduit les cinq tables public, contraintes, index, RLS et triggers historiques. |
| `20261016000200_move_to_novabudget` | Transaction ALTER TABLE SET SCHEMA sans copie ni recréation ; conserve données/FK/index, grants explicites, policies authenticated, triggers durcis. |

Les FK `auth.users` et le CHECK des catégories sont dans le SQL versionné (non modélisés dans Prisma).
La fonction historique public reste présente pour préserver ses éventuelles autres dépendances, avec search_path fixé à pg_catalog.
La nouvelle fonction est SECURITY INVOKER au search_path pg_catalog ; authenticated/service_role ont le CRUD, anon aucun droit sur les tables.

## Installation vide
Le socle Supabase doit fournir `auth.users`, `auth.uid()` et les rôles anon/authenticated/service_role ; les migrations ne créent aucun compte.
Fournir `DIRECT_URL` ou `POSTGRES_URL_NON_POOLING` dans l’environnement du processus, avec TLS vérifié. Le runner utilise cette connexion directe pour les deux URL Prisma ; aucune URL poolée de repli.
Après confirmation utilisateur via `release-deploy`, `npm run db:deploy` exécute **uniquement prisma migrate deploy**, baseline puis transfert.
Prisma charge son `.env` habituel ; la connexion directe du runner doit toutefois être fournie dans l’environnement. Les secrets ne sont pas journalisés par le wrapper.
La génération du client reste `npm install`/`npx prisma generate`, indépendante de la migration.

## Base existante sans historique Prisma
**Ne jamais lancer db:deploy avant adoption de la baseline.** Le DDL de baseline refuse une table déjà existante et annule sa transaction ; il ne masque pas une adoption oubliée. Audit du 16/10 : 11 lignes public, aucune table `_prisma_migrations`.
1. Après autorisation, sauvegarder données + schéma et vérifier une restauration jetable ; prévoir une fenêtre de maintenance.
2. Comparer la base réelle à la baseline : colonnes/types/defaults, PK/FK/CHECK, index, RLS/policies, triggers ; inventorier grants et dépendances. Tout écart bloque l’adoption jusqu’à résolution/revue. PGlite prouve l’équivalence avec le SQL historique, pas l’absence de dérive distante.
3. Après comparaison conforme et confirmation utilisateur, marquer manuellement la baseline appliquée : `prisma migrate resolve --applied 20261016000100_public_baseline`, avec connexion directe et même schéma de suivi Prisma qu’au déploiement. **Commande jamais exécutée pendant ce lot.**
4. Contrôler `prisma migrate status` : baseline adoptée, seul transfert en attente. Le paramètre `schema` de l’URL détermine l’emplacement du suivi `_prisma_migrations` : le garder identique entre resolve/deploy.
5. Suivre `docs/handoff/l6-plan.md` pour la coordination SQL/API/client et le retour arrière.

## Commandes et déploiement Web
Ne pas utiliser `prisma db push`, `migrate reset`, `migrate dev` sur la base partagée ni rejouer le SQL Supabase historique. Le script `db:push` a été supprimé.
Vercel : build `npm run build`, sortie `dist`, installation `npm install`. Une installation ne migre pas la base.
Variables publiques client : `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` ; aucun secret serveur sous ce préfixe. L’intégration peut fournir `POSTGRES_URL_NON_POOLING` pour migrer.
À L6 seulement : coordonner exposition API de novabudget (Exposed schemas) et changement du client cloud ; aucun grant anon sur les tables.
Ce document n’autorise aucun push, déploiement, changement d’exposition API ni application distante.

## Preuves locales reproductibles
`npm test` exécute le SQL exact sur PGlite 0.5.10 avec auth/rôles factices : OID/ids/lignes, baseline/historique, grants/FK cascade, CRUD RLS A/B, triggers, rollback collision.
`npx prisma validate` et `npx prisma generate` n’appliquent aucune migration. Le harness strict couvre mode local et cloud simulé, client public inchangé.
PGlite exécute PostgreSQL embarqué ; les contrôles Supabase API, TLS, paramètres et advisors restent à faire à L6.
