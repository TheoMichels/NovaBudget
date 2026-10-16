# Contrat de tests — L5
| AC | Niveau / preuve | Commande |
|---|---|---|
| S01 | Audit imports/mutations ; CRUD quatre tables avec faux transport ; E2E local existant + CRUD cloud | npm test ; test:e2e |
| S02 | Compteurs push sans SELECT, pull sans mutation, vide/nonvide, monnaies chaînes, invalidité avant writes | tests/syncService.test.mjs |
| S03 | Cache avant réseau, edits simultanés, incréments ordonnés, panne, réponse périmée et suppression ; reload hors ligne collections/réglages | tests/syncService.test.mjs ; monthlyContribution.test.mjs |
| S03 | Navigateur cloud : cache/réglages visibles et feedback français avec API réellement interrompue, reload | e2e/cloud-mode.spec.ts |
| S04 | Auth inscription/connexion/déconnexion, erreur française/succès/session/subscription/local ; callback web et logout E2E | authService.test.mjs ; cloud-mode.spec.ts |
| S05 | Contrat MCP intégré (empreinte), aliases dérivés ; génération avec runner substitué et schéma explicite/fichier préservé | generatedDatabaseTypes.test.mjs ; typecheck |
| S06 | Fiche ≤40 lignes, audit C1–C12 ; harness strict, QA et revue indépendantes | verify-harness --strict |
- Zéro compte réel ni réseau Supabase : transport cloud simulé, exports synthétiques EXPO_NO_DOTENV=1.
- Garde console conservée : seul le test offline autorise ERR_INTERNET_DISCONNECTED à l’URL REST synthetic.supabase.invalid ; autres erreurs/5xx restent bloquantes.
- Tests initiaux rouges : sync ownership/push/pull/concurrence ; auth traduction/callback (logs /tmp/novabudget-sync-red.log et auth-red.log).
- Test historique réponse cloud invalide conservé inchangé ; loader résout désormais la même frontière mockée malgré un import relatif déplacé.
- Test incréments : ajout seulement d’un stub du nouveau feedback sync, assertions inchangées.
- Contrôle Supabase réel (API/TLS/RLS/advisors) réservé L6 ; aucun appel distant de mutation.
- Race additionnelle rouge/vert : lecture dispatchée après édition locale avant commande cloud (100 restauré au lieu300) ; marque non-confirmée + ACK de révision, /tmp/novabudget-sync-race-red.log.
- ACK par commande :2éléments, échec updateA/deleteA puis succèsB/get/push/get ; rouges puis verts, sans modifier les assertions (/tmp/novabudget-sync-ack-red.log).
