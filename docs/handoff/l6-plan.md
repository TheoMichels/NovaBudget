# L6 — plan de bascule distante (non exécuté)
1. Confirmer projet partagé cible, inventaire dépendances public, variables (noms seuls), paramètre schema stable des URL directes et Exposed schemas actuels.
2. Revue code/SQL et QA PASS sur L4 puis client novabudget préparé avec types générés et tests cloud ; demander confirmation utilisateur distincte pour sauvegarde, application SQL et configuration API/Vercel.
3. Fenêtre de maintenance : bloquer écritures/sync pendant sauvegarde et bascule. Backup logique chiffré schéma+données (auth inclus selon droits) ; tester restauration jetable et conserver ancien projet intact.
4. Recompter par table et user_id, comparer ids/contenus/hachages ; référence audit 16/10 : savings_accounts 2, expenses 2, future_projects 2, inflows 4, user_settings 1 (11 total), à rafraîchir avant action.
5. Comparer baseline au réel (colonnes/types/defaults/contraintes/index/RLS/triggers/grants). Divergence : arrêt et nouvelle migration revue ; ne pas marquer conforme par hypothèse.
6. Après accord et comparaison conforme, adopter manuellement baseline via migrate resolve --applied 20261016000100_public_baseline ; vérifier historique/status. Ne pas exécuter son DDL sur données existantes.
7. Appliquer uniquement prisma migrate deploy via db:deploy et connexion directe TLS ; le transfert versionné est une transaction. Toute collision échoue et annule le SQL ; Prisma garde alors un statut échoué à résoudre après inspection (jamais modification d’une migration appliquée).
8. Exposer novabudget dans API Supabase ; basculer le client cloud/types et déployer la version préparée dans la même maintenance (accord distinct release-deploy). Garder paramètres/grants des autres apps.
9. Vérifier comptages, ids/contenus, FK/CHECK, grants, 4 policies/table, triggers search_path, advisors, parcours CRUD/reload et isolation A/B sur environnement autorisé. Le local navigateur doit rester autonome.
10. Reprendre écritures uniquement après validation ; archiver preuve et retirer le SQL Supabase historique du chemin actif à L6 validé. Ne supprimer ni backup ni ancien projet avant accord.

## Retour arrière
- Avant COMMIT : transaction rollback intégral ; collision prouvée localement par PGlite.
- Après COMMIT, avant reprise d’écritures : remettre ancien client public et préparer une migration inverse revue/confirmée (ALTER TABLE novabudget.<table> SET SCHEMA public pour les 5 tables, fonction/triggers/policies/grants selon inventaire sauvegardé). Contrôler absence collisions public et conserver historique Prisma cohérent ; jamais reset/db push.
- Si écritures reprises : nouveau backup/comptages et rapprochement obligatoire avant migration inverse ; ne pas restaurer aveuglément un backup ancien. Restauration du backup testé seulement après décision explicite et acceptation de la fenêtre de perte éventuelle.
- En échec SQL : arrêter, inspecter status et données, corriger par migration ou resolve --rolled-back seulement après contrôle ; aucune relance automatique.
