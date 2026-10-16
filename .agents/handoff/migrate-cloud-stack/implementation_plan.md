# L5 — synchronisation et authentification conformes
- Exécution après validation et commit L4 ; même branche feature/local-browser-storage, aucune écriture distante.
- Audit revue : 18 écritures directes dans repositories ; sync importe leurs getters/savers, provoquant des cycles si import inverse ; pull réécrit cloud et collections vides conservent cache obsolète.
- Décision : primitives cache seulement séparées, commandes cloud uniquement dans syncService ; interfaces hooks/repositories conservées et clés locales identiques.
- Auth : traduire erreurs françaises et détecter callback URL sur web ; configuration cloud manquante doit rester une erreur explicite. Schéma runtime public jusqu’à bascule distante approuvée.
| AC | Action | Résultat observable | Preuve |
|---|---|---|---|
| AC-S01 | CRUD local, reload et appels cloud | Persistance locale inchangée sans auth/réseau ; toute mutation Supabase métier passe par syncService | Tests intégration et E2E + audit imports |
| AC-S02 | Push cache, pull distant vide/non vide, réponse invalide | Push lit uniquement cache ; pull ne fait aucune mutation cloud et remplace collections par vide si serveur vide ; données invalides ne sont pas écrites | Tests services avec compteurs requêtes + E2E cloud simulé |
| AC-S03 | CRUD cloud dont suppression, délai/erreur serveur et reload hors ligne avec session persistée | Cache immédiat et cache valide visible hors ligne, commandes cloud validées, erreurs contrôlées en français, aucun incrément perdu et aucune réintroduction après suppression confirmée | Régressions sync + parcours cloud/offline |
| AC-S04 | Connexion/inscription/déconnexion/callback, erreur API | Messages auth français, modes isolés ; tests simulés sans compte réel ; client unique | Tests auth et E2E existants étendus |
| AC-S05 | Types base et configuration | Types générés depuis schéma public actuel avec provenance, script de régénération documenté ; absence schema novabudget runtime expliquée jusqu’à L6 | Typecheck + revue documentaire |
| AC-S06 | Harness et fiche projet | typecheck/lint/unit/build/e2e PASS ; fiche ≤40 lignes et audit C1–C12 actualisé | QA indépendante et revue obligatoire auth/sync |
- Scope builder : src/services/, src/storage/, src/hooks/ si nécessaire, src/types/database.ts, src/config/, tests/, e2e/, scripts génération types, docs/LOCAL_STORAGE.md, .agents/project.md et handoff courant ; App.tsx seulement pour conserver le dashboard visible avec feedback offline (finding de revue).
- Ne pas altérer Prisma/migrations ni déploiement déjà validés ; ne pas modifier docs/AUDIT_STANDARDS.md utilisateur. Pas de push/déploiement/SQL distant.
