# NovaBudget — fiche projet
> Faits uniquement, maintenus par l'agent (≤ 40 lignes). Les règles sont dans ~/.codex/AGENTS.md.

## Produit
- But : suivi budgétaire personnel (dépenses, épargne, matelas de sécurité, projections).
- Utilisateur : moi seul · Plateformes : web PWA prioritaire (Vercel), mobile via Expo.

## Stack
- Expo 57 + RN Web, React 19, TS strict ; Zod 3.25.76 valide formulaires, stockage et réponses métier. AsyncStorage via repositories/cacheOnly ; mutations cloud centralisées dans syncService, lectures hors ligne avec cache validé ; auth française et callback web.
- Prisma = unique source du schéma `novabudget`/`auth` ; transfert transactionnel et validation PGlite (dev). Aucun écart : schéma `novabudget` actif en client et migrations.
- Stockage selon l'environnement : en local (origine loopback, export hors Vercel) stockage navigateur sans auth ni Supabase ; sur Vercel, auth + synchro. Ne pas activer le cloud d'après la présence des clés ou `NODE_ENV`. Détail : `docs/LOCAL_STORAGE.md`.

## Commandes
| Action | Commande |
|---|---|
| Installer | `npm install` (lance `prisma generate`) |
| Dev | `npm run web` (garder la même origine pour retrouver les données) |
| Typecheck / Lint | `npm run typecheck` / `npm run lint` |
| Tests (unit + intégration) / E2E | `npm test` / `npm run test:e2e` |
| Build | `npm run build` (`expo export -p web`) |
| Port de preview QA | 4173 (build web local) |
| Déploiement base | `npm run db:deploy` — Prisma migrate deploy seul, connexion directe ; via `release-deploy` |

## Modèle de données
| Entité | Type | Repository |
|---|---|---|
| Dépense | `src/types/expense.ts` | `src/storage/expenseRepository.ts` |
| Compte épargne | `src/types/savingsAccount.ts` | `src/storage/savingsRepository.ts` |
| Projection, projets, entrées | `src/types/projection.ts` | `src/storage/projectionRepository.ts` |
| Réglages | — | `src/storage/settingsRepository.ts` |
| Types base distante | `src/types/database.ts` (schéma novabudget) | `node scripts/generate-db-types.mjs --project-id <ref> --schema novabudget` |

## Design
- Tokens `src/theme/colors.ts` : primaire `#059669`, marque `#0F2922`, positif `#059669`, alerte `#D97706`, surfaces glass ; `radius` 12/16/20/24, `spacing` 4/8/12/16/24/32.
- Ambiance finance haut de gamme, rayons 16–24, ombres douces. Montants `1 250,00 €`, dates `JJ/MM/AAAA`. `useMemo` pour les séries des graphiques de projection.

## Zones sensibles et déploiement
- **Données réelles en production.** Ne jamais modifier une migration Supabase déjà appliquée (en créer une nouvelle).
- Toute modification de `syncService.ts` ou `authService.ts` → revue `code-reviewer`.
- Web : Vercel (`vercel.json`). Variables : voir `.env.example`.
