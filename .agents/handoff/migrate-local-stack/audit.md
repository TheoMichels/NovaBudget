# Audit C1–C12 — lot L1–L3
| Critère | État | Fait / preuve |
|---|---|---|
| C1 | OK | package.json : Expo 57, React 19 ; tsconfig strict ; export dist via harness. |
| C2 | OK | Arborescence conforme ; AuthScreen/AuthModal importent config/supabase.ts, aucune UI ne dépend du module client. |
| C3 | OK lot | colors.ts : gradient, surfaces, shadows, radius/spacing ; dashboard loading/empty/error, retry et données. |
| C4 | OK métier | types/validation.ts ; repositories/validatedStorage ; formulaires ajout/auth/édition ; sync valide le lot distant avant écriture. |
| C5 | ÉCART | prisma/schema.prisma cible public/auth ; supabase/migrations coexiste ; pas de _prisma_migrations distant. Préparation L4 nécessaire. |
| C6 | ÉCART distant | MCP parent : 5 tables public, toutes RLS + 4 policies CRUD + FK auth.users CASCADE + trigger updated_at. Advisor : search_path mutable sur update_updated_at_column. |
| C7 | ÉCART | Projet partagé supabase-claret-house (skzehjvqvdbxfehbrgzu), novabudget absent ; exposition API non confirmée. |
| C8 | ÉCART mineur | Auth client/service/hook/écran présents ; database.ts manuel ; advisor protection mots de passe divulgués désactivée. |
| C9 | OK | config/storageMode.ts, app.config.js, docs/LOCAL_STORAGE.md ; clés v3 et modes local/cloud conservés. |
| C10 | OK sous QA | Scripts présents ; harness local/cloud simulé ; détail .agents/state/verify-result.json. |
| C11 | OK config / distant | vercel.json/.env.example/.gitignore présents ; MCP parent : nova-budget relié GitHub TheoMichels/NovaBudget, prod READY main 54e4c78 ; variables requises présentes. |
| C12 | OK | Fiche projet 40 lignes, dépendance/tokens/écarts actualisés. |

## Données distantes (lecture MCP par orchestrateur, 16/10/2026)
- public : savings_accounts=2, expenses=2, future_projects=2, inflows=4, user_settings=1 ; aucune mutation.
- Migrations Supabase listées : aucune ; historique Prisma absent. Toute bascule nécessite inventaire et sauvegarde vérifiée.
- Variables Vercel vérifiées par nom : EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, POSTGRES_PRISMA_URL, POSTGRES_URL_NON_POOLING.
- L4 : préparer Prisma multiSchema novabudget/auth et SQL grants/RLS/trigger/FK sans modifier les migrations déjà appliquées ; plan de copie et conservation des ids avant autorisation L6.
