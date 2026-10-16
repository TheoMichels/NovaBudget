# Contrat de tests — préparation Prisma
| AC | Test / contrôle | Commande |
|---|---|---|
| P01 | Schéma valide/généré ; baseline vs historique : colonnes/contraintes/index/RLS/triggers | prisma validate + prisma generate ; npm test |
| P02 | Runner injecté sans réseau : unique migrate deploy, URL directe/repli, absence URL, échecs ; db:push absent | tests/prismaMigrations.test.mjs |
| P03 | SQL exact sur PGlite : transfert conserve OID/ids/lignes, grants, FK/cascade, CRUD RLS A/B, trigger, rollback collision, adoption historique | tests/prismaMigrations.test.mjs |
| P04 | Tests locaux/cloud simulé existants ; aucune modification src ni clés | harness strict + diff |
| P05 | Revue plan L6/audit/fiche ≤40 lignes ; absence appel distant | contrôle documentaire QA/review |
- Dépendance de test @electric-sql/pglite verrouillée 0.5.10 ; auth/users/rôles uniquement factices, moteur PostgreSQL embarqué.
- Rouge préalable : runner sans export deployDatabase (log /tmp/novabudget-prisma-red.log) ; limite : échec de liaison avant assertions, pas un rouge métier.
- Tests CRUD contrôlent propriétaire A puis B, rejet insert/update croisés, update/delete invisibles et insertion/suppression propres ; tests exécutés sur les cinq tables.
- Couverture PostgreSQL locale, pas de preuve API Supabase réelle ; celle-ci reste L6.
