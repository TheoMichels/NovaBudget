# QA indépendante — migrate-prisma-stack L4

VERDICT: PASS
Harness strict frais : PASS, 2026-10-16T18:58:37Z, HEAD e435389 ; typecheck, lint, unit, build, E2E PASS. 26 tests unitaires PASS.
| AC | Résultat | Preuve indépendante |
|---|---|---|
| AC-P01 | PASS | `npx prisma validate` et `npx prisma generate` PASS. `tests/prismaMigrations.test.mjs` compare baseline aux colonnes/contraintes/index/RLS/policies/triggers legacy ; test PGlite vert. Transfert vérifie cinq tables, FK, grants, 4 policies par table, trigger `search_path=pg_catalog` et `SECURITY INVOKER`. |
| AC-P02 | PASS | Test injecté sans réseau : appel unique `prisma migrate deploy`, URL directe obligatoire/repli, erreurs propagées, `db:push` absent. `db:deploy` appelle uniquement le runner Prisma. Guide distingue installation vide et adoption après comparaison + `migrate resolve`; aucune application distante. |
| AC-P03 | PASS | Trois tests PGlite verts : conservation OID/ids/lignes et isolation CRUD A/B sur 5 tables ; FK/cascade/grants/triggers ; collision annule le transfert et laisse le schéma/données public intact. Adoption legacy ne rejoue pas la baseline. |
| AC-P04 | PASS | Harness strict frais PASS. `src/` absent du diff ; client cloud public et clés locales inchangés. E2E local/cloud de non-régression PASS. |
| AC-P05 | PASS | `l6-plan.md` décrit backup restaurable, comptages par utilisateur, ordre, confirmation distincte, rollback avant/après commit et gestion après reprises d’écritures. Audit liste explicitement les validations distantes différées. Fiche projet : 40 lignes. |

Limites documentées : comparaison au schéma réel, historique Prisma, TLS, exposition API `novabudget`, advisors et restauration de sauvegarde restent à vérifier en L6 après autorisation. Aucune connexion ou écriture distante effectuée ; aucune modification applicative.
