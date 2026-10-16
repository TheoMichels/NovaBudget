# Build Report — migrate-prisma-stack
- **Statut** : READY_FOR_QA
- **Cycle** : 1 ; branche feature/local-browser-storage ; aucun commit/push par le builder.
| Fichiers | Rôle / périmètre |
|---|---|
| prisma/schema.prisma + migrations/ | Cible novabudget/auth, baseline public puis transfert transactionnel ; autorisé |
| scripts/deploy-db.mjs ; package*.json | migrate deploy seul ; db:push retiré ; PGlite 0.5.10 dev verrouillé ; autorisé |
| tests/prismaMigrations.test.mjs | Runner sans réseau + 3 tests PostgreSQL embarqué ; autorisé |
| docs/SUPABASE_DEPLOYMENT.md ; .agents/project.md | Adoption baseline, commande directe, archive historique ; autorisé |
| handoff courant | Audit, contrat tests, plan L6 et rapport ; autorisé |
- Schéma modifié localement uniquement ; legacy Supabase inchangé, client public et AsyncStorage inchangés.
- Aucune commande distante exécutée (application, resolve, backup, mutation API/Vercel) ; aucune modification src/types.
| AC | Implémentation / preuve |
|---|---|
| P01 | prisma validate + generate PASS ; baseline équivalente legacy sur colonnes/contraintes/index/policies/triggers (test PGlite) |
| P02 | Runner unique migrate deploy, URL directe/repli Vercel, échecs propagés ; test sans réseau PASS |
| P03 | SQL exact conserve OID/ids/lignes ; 5 tables CRUD A/B, grants, FK cascade, triggers ; collision rollback et adoption legacy PASS |
| P04 | Harness strict final PASS : typecheck/lint/unit/build/e2e ; premier run E2E bloqué par ancien serveur NovaBudget, libéré avant relance |
| P05 | l6-plan.md + audit.md + guide ; fiche 40 lignes ; revue indépendante requise |
- 4/4 tests migrations PASS, dont 3 tests PGlite ; npm test couvre tous les nouveaux tests.
- Rouge préalable : export runner absent (/tmp/novabudget-prisma-red.log), échec de liaison avant assertions ; limite signalée.
- Baseline volontairement non idempotente : table existante ⇒ erreur et rollback ; resolve manuel seulement après comparaison conforme.
- FK auth.users et CHECK catégorie conservés en SQL (non modélisés Prisma) ; 4 policies authenticated/table, aucun droit anon.
- Nouvelle fonction trigger SECURITY INVOKER search_path pg_catalog ; ancienne fonction public conservée et durcie.
- Limites L6 : drift réel, API Supabase, TLS/advisors, restauration backup ; PGlite ne les prouve pas.
- Écarts de périmètre : aucun ; UI : aucune modification ; AC : aucun redéfini.
- Preuve harness : .agents/state/verify-result.json (PASS, 16/10/2026) ; aucun serveur de test conservé.
