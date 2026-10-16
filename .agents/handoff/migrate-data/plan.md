# Bascule distante NovaBudget — proposition non exécutée
- Source vérifiée : projet skzehjvqvdbxfehbrgzu (supabase-claret-house), schéma public.
- Cible recommandée : même projet comme projet partagé, schéma novabudget ; décision utilisateur requise. Un autre projet demanderait un plan de copie et remappage auth distinct.
- Inventaire du 16/10/2026 : savings_accounts=2, expenses=2, future_projects=2, inflows=4, user_settings=1 ; 11 lignes à recompter avant action.
- SQL préparé : prisma/migrations/20261016000100_public_baseline/migration.sql puis 20261016000200_move_to_novabudget/migration.sql.
- Historique actuel absent : après contrôle de dérive complet, marquer uniquement la baseline conforme appliquée, puis déployer la migration de transfert. Ne pas exécuter la baseline sur les tables existantes.

| Étape | Contrôle et ordre |
|---|---|
| Accord | Confirmation explicite du projet cible, backup, migration et configuration distante ; déploiement via release-deploy |
| Maintenance | Suspendre écritures et sync, relever version/client, inventaire grants/RLS/triggers/Exposed schemas |
| Sauvegarde | Export sécurisé schéma+données autorisé, stockage .agents/state/backup ignoré, tester restauration sur base jetable ; aucun secret dans rapports |
| Référence | Comptages, ids et hachages/contenus par table ; comparaison baseline/réel sans présumer conformité |
| Historique | migrate resolve --applied de la baseline seulement si conforme, contrôle status |
| Transfert | db:deploy applique SQL Prisma transactionnel exact ; ALTER TABLE SET SCHEMA, pas de copie/drop |
| API et client | Exposer novabudget, générer types cible, changer db.schema du client, tests cloud simulés puis livraison coordonnée approuvée |
| Validation | Comptages/ids/hachages identiques, policies A/B, grants/FK/triggers, advisors et CRUD/reload ; local autonome |
| Reprise | Réactiver écritures après validation utilisateur, conserver backup/ancien projet et archiver migration Supabase historique |

## Retour arrière
- Échec avant commit SQL : rollback transactionnel prouvé sur PGlite ; arrêter et inspecter status avant toute autre tentative.
- Après commit, écritures toujours suspendues : migration inverse revue/confirmée vers public, restauration des grants/policies/triggers d’après inventaire et client public coordonné ; vérifier collisions et historique.
- Après reprise : backup récent et rapprochement des nouvelles écritures avant toute restauration ; pas de reset, db push ni restauration aveugle.
- Détail : ../migrate-prisma-stack/l6-plan.md ; tests locaux ne prouvent pas configuration API/TLS/advisors ni restauration réelle.
- Aucune sauvegarde réelle, baseline resolve, migration, modification API/Vercel, push ou déploiement exécuté à ce stade.
