# Audit C1–C12 — après préparation L4 et lot L5
| Critère | État | Fait / preuve |
|---|---|---|
| C1 | OK local | Expo57/React19/TS strict ; build dist du harness |
| C2 | OK | Repositories minces → syncService/cacheOnly ; aucune UI importe le client Supabase |
| C3 | OK hérité L1–L3 | Tokens et4 états conservés ; feedback panne cloud avec cache affiché, sans nouvel écran |
| C4 | OK métier | Zod cache/formulaires/auth et réponses ; push/pull valident lot complet avant writes |
| C5 | ÉCART temporaire | Cible Prisma novabudget/auth et migrations L4 validées ; archive Supabase immuable gardée jusqu’à L6 ; historique réel non adopté |
| C6 | ÉCART distant | L4 grants/FK/4policies/triggers search_path fixe testés PGlite ; réel public inchangé, advisor search_path mutable à corriger L6 |
| C7 | ÉCART | Client public explicite pour compatibilité ; novabudget distant absent/exposition API non confirmée selon audit16/10 |
| C8 | OK code / ÉCART distant | Client unique, auth FR/callback web, hooks ; types réellement générés MCP public16/10 intégrés ; protection mots de passe divulgués désactivée selon audit distant |
| C9 | OK | Modes local/cloud et6 clés v3 inchangés ; docs/LOCAL_STORAGE.md |
| C10 | OK local | Harness strict PASS16/10 19:14Z : types/lint/unit/build/e2e ;42 tests unit/intégration,15 E2E ; QA indépendante à venir |
| C11 | OK config / distant inchangé | Vercel/GitHub/variables constatés audit distant L1–L3 ; aucune mutation/env/push ; pas de secret commité |
| C12 | OK | Fiche40 lignes, commande introspection et écarts distants explicités |
- Sources distantes : ../migrate-local-stack/remote-audit.md (MCP lecture16/10), types MCP generate_typescript_types fournis par orchestrateur pour skzehjvqvdbxfehbrgzu/public (PostgREST14.18).
- Types intégrés src/types/database.ts ; copie handoff supprimée ; empreinte du corps intégré contrôlée par generatedDatabaseTypes.test.mjs.
- Script types testé sans réseau ; aucune génération CLI réelle, application SQL, backup réel, modification API/Vercel ou publication pendant L5.
- Limites explicites : pas de reprise persistante des commandes après fermeture ; Push n’infère pas les suppressions ; DELETE en échec à retenter avant Pull ; pas de transaction multi-tables cloud.
- Bascule distante uniquement selon ../migrate-data/plan.md (canonique, conservé) et ../migrate-prisma-stack/l6-plan.md ; accord utilisateur requis.
