# Préparation locale Prisma — suite de migrate-local-stack

## Périmètre et décisions
- Base inchangée : feature/local-browser-storage ; exécution après PASS et commit du lot L1–L3.
- Objectif : une chaîne de migrations Prisma versionnée vers novabudget/auth, prête à être revue et testée sans modifier la base réelle.
- Demande de migration autorise le code local ; données distantes, exposition API et configuration Vercel nécessitent confirmation distincte (skill migrate-app §3).
- Source actuelle : cinq tables public, onze lignes, sans historique Prisma ; voir ../migrate-local-stack/remote-audit.md.
- Ne pas changer le schéma utilisé par le client cloud tant que la base réelle n’a pas basculé. Le mode local reste intact.
- Ne pas supprimer ni réécrire la migration Supabase historique avant la bascule L6 ; la conserver comme référence historique explicite.

| AC | Précondition et action | Résultat observable | Vérification |
|---|---|---|---|
| AC-P01 | Inspection Prisma et migrations | Schéma cible novabudget/auth, baseline reproduisant public puis transfert non destructif versionné ; FK, grants, RLS 4 policies et triggers durcis sur 5 tables | prisma validate + génération + revue SQL |
| AC-P02 | Appel db:deploy et documentation | Utilise uniquement prisma migrate deploy, jamais SQL legacy ni db push ; procédure baseline existante/installation vide explicite et sans application distante pendant ce lot | Tests script runner sans réseau + revue |
| AC-P03 | Exécution des migrations sur Postgres jetable PGlite avec utilisateurs factices | Création puis transfert conservent ids/lignes ; FK, grants, quatre policies, triggers et isolation entre utilisateurs vérifiés ; rollback transactionnel sur collision | Tests SQL exécutés localement |
| AC-P04 | Harness local + cloud simulé | Toutes étapes PASS, client cloud reste compatible public, clés locales inchangées | QA indépendante + harness strict |
| AC-P05 | Plan L6 et fiche | Plan backup/comptages/ordre/retour arrière/confirmation ; fiche ≤40 lignes et audit exact des écarts non exécutés | Revue documentaire et sécurité |

## Ownership et vérification
- Même fullstack-builder : prisma/, scripts/deploy-db.mjs, package*.json si scripts changent, tests de migration/outillage, docs/SUPABASE_DEPLOYMENT.md, .agents/project.md et handoff courant.
- src/ seulement si adaptation minimale des types nécessaire ; aucun changement de schéma runtime cloud ni de comportement local.
- code-reviewer obligatoire sur SQL/RLS et scripts ; qa-inspector indépendant.
- Aucun push, branche Supabase payante, sauvegarde de données réelles ni application distante.
- Décision du 16/10 après reprise : PGlite 0.5.10 installé dans /tmp/novabudget-pg-validation ; tests SQL possibles localement. Dépendance de test verrouillée autorisée si nécessaire pour rendre la preuve reproductible ; aucune utilisation en runtime applicatif.
- Docs consultées : [schémas Supabase](https://supabase.com/docs/guides/api/using-custom-schemas), [PGlite](https://pglite.dev/docs/). Changelog Supabase lu ; changements TLS HTTP et extensions Postgres sans incidence identifiée sur ce transfert de tables ordinaires.
