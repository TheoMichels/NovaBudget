# NovaBudget — fiche projet
> Faits uniquement, maintenus par l'agent (≤ 40 lignes). Les règles sont dans ~/.codex/AGENTS.md.

## Produit
- But : suivi budgétaire personnel (dépenses, épargne, matelas de sécurité, projections).
- Utilisateur : moi seul · Plateformes : web PWA prioritaire (Vercel), mobile via Expo.

## Stack
- Expo + RN Web, React 19, TS strict. Offline-first : AsyncStorage via `src/storage/*Repository.ts` (cache local) + synchro Supabase `src/services/syncService.ts`, auth `src/services/authService.ts`.
- ⚠️ Source de vérité du schéma **non tranchée** : `supabase/migrations/` et `prisma/schema.prisma` coexistent. À décider (et noter ici) avant toute évolution du schéma.
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
| Déploiement base | `npm run db:deploy` — via `release-deploy` uniquement (`docs/SUPABASE_DEPLOYMENT.md`) |

## Modèle de données
| Entité | Type | Repository |
|---|---|---|
| Dépense | `src/types/expense.ts` | `src/storage/expenseRepository.ts` |
| Compte épargne | `src/types/savingsAccount.ts` | `src/storage/savingsRepository.ts` |
| Projection, projets, entrées | `src/types/projection.ts` | `src/storage/projectionRepository.ts` |
| Réglages | — | `src/storage/settingsRepository.ts` |
| Types base distante | `src/types/database.ts` | via `syncService` |

## Design
- Tokens `src/theme/colors.ts` · Primaire `#0D9488` / `#059669` · Positif `#10B981` · Alerte `#F59E0B` · Surfaces `#FFFFFF` `#F8FAFC` `#F1F5F9` · Textes `#0F172A` `#475569` `#64748B`.
- Ambiance finance haut de gamme, rayons 16–24, ombres douces. Montants `1 250,00 €`, dates `JJ/MM/AAAA`. `useMemo` pour les séries des graphiques de projection.

## Zones sensibles et déploiement
- **Données réelles en production.** Ne jamais modifier une migration Supabase déjà appliquée (en créer une nouvelle).
- Toute modification de `syncService.ts` ou `authService.ts` → revue `code-reviewer`.
- Web : Vercel (`vercel.json`). Variables : voir `.env.example`.
