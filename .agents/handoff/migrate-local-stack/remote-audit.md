# Audit distant — lecture seule — 16/10/2026
| Contrôle | Résultat MCP |
|---|---|
| Supabase | Projet skzehjvqvdbxfehbrgzu, supabase-claret-house, ACTIVE_HEALTHY |
| Tables | public.savings_accounts=2 ; expenses=2 ; future_projects=2 ; inflows=4 ; user_settings=1 (comptages exacts SELECT) |
| Sécurité | 5/5 tables avec RLS, 4 policies CRUD, FK auth.users ON DELETE CASCADE et trigger updated_at |
| Historique | Aucune table _prisma_migrations ; list_migrations vide |
| Cible | Schéma novabudget absent ; exposition API non confirmée |
| Advisor | Fonction public.update_updated_at_column : search_path mutable ; protection mots de passe compromis désactivée |
| Vercel | Projet nova-budget, prj_6DZo4wBXPL5RxxD3hm5pH9JtndGA ; production READY sur main 54e4c78 |
| Variables (noms seuls) | EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, POSTGRES_PRISMA_URL, POSTGRES_URL_NON_POOLING présents |
| GitHub | TheoMichels/NovaBudget, remote origin/main ; aucune PR ouverte lors de la recherche |

## Bascule à préparer après les lots locaux
1. Confirmer le projet partagé cible : le projet actuel contient déjà les données NovaBudget ; son utilisation partagée reste à vérifier.
2. Créer une migration Prisma de référence reproduisant public sans modifier le SQL historique appliqué ; la marquer appliquée uniquement après vérification de la base existante.
3. Ajouter une migration transactionnelle transférant les cinq tables vers novabudget avec ALTER TABLE SET SCHEMA (aucun drop/recreate), grants, RLS et fonction de trigger au search_path fixé.
4. Vérifier cette chaîne sur branche Supabase ou Postgres jetable, régénérer les types, préparer le client novabudget et les tests cloud simulés dans le même lot de bascule.
5. Avant application distante : sauvegarde autorisée, comptages, plan de retour arrière et revue ; confirmation utilisateur requise.
6. Exposer novabudget à l’API, appliquer le SQL exact de prisma/migrations, vérifier comptages/RLS/advisors ; conserver données et ancien projet jusqu’à validation.

L’application doit continuer à utiliser public tant que la base distante n’a pas basculé. Les clés AsyncStorage locales restent inchangées.

Remédiations advisors : [search_path](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable), [mots de passe](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
