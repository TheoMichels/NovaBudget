# Audit de préparation locale — 16/10/2026
| Sujet | État |
|---|---|
| Référence distante | ../migrate-local-stack/remote-audit.md : 5 tables public, 11 lignes, pas d’historique Prisma (lecture antérieure) |
| Source cible | Prisma novabudget/auth ; FK auth.users et CHECK conservés dans SQL |
| Baseline | Reproduction historique testée sur PostgreSQL embarqué ; dérive réelle à comparer avant resolve |
| Transfert | ALTER TABLE SET SCHEMA transactionnel ; conserve OID, données, FK, index ; aucune copie/drop table |
| Sécurité | 4 policies authenticated/table, CRUD grants explicites, aucun droit anon, trigger SECURITY INVOKER search_path pg_catalog ; ancienne fonction public durcie |
| Legacy | Fichier Supabase inchangé et explicitement archivé jusqu’à L6 ; runner ne le lit plus |
| Runtime | Client public et clés AsyncStorage inchangés ; aucun fichier src modifié |
| Dépendance | @electric-sql/pglite 0.5.10 dev uniquement, verrouillée |
| Exécution distante | Aucune application, baseline resolve, backup réel, mutation API/Vercel ou push |
| Limites | Exposition API novabudget, comparaison réel/baseline, TLS, advisors et restauration backup à vérifier L6 |
- Docs déjà consultées : changelog Supabase, custom schemas, PGlite ; aucun changement récent identifié impactant ces tables ordinaires.
- Règles utilisateur Prisma prioritaires sur recommandation du skill Supabase de créer migrations via sa CLI.
