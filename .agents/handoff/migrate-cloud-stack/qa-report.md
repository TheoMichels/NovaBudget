# QA indépendante — migrate-cloud-stack L5

VERDICT: PASS
Harness strict frais : PASS, 2026-10-16T19:15:40Z, HEAD e807858 ; typecheck/lint/unit/build/e2e PASS. 42 tests unitaires, 15 E2E PASS.
| AC | Résultat | Preuve indépendante |
|---|---|---|
| AC-S01 | PASS | `tests/syncService.test.mjs` vérifie l’absence de client/auth dans les repositories et l’ownership des mutations ; recherches `.from()/upsert/delete` : mutations métier uniquement dans `syncService`. `e2e/cloud-mode.spec.ts` couvre CRUD cloud + rechargement ; suite locale E2E PASS. |
| AC-S02 | PASS | Tests push sans SELECT, pull sans mutation et vidage des collections vides ; lot entier validé avant writes, réponses invalides préservent le cache. E2E serveur vide confirme Pull sans écriture cloud. |
| AC-S03 | PASS | Tests retard/race, édition avant GET, incréments ordonnés, erreurs contrôlées, ACK par commande (échec A/succès B/push) et suppression confirmée non ressuscitée. E2E offline rechargé : cache, réglages et message français visibles. Capture desktop `screens/cloud-offline-cache.png` ; 375 px sans overflow vérifié par E2E/capture `screens/local-mobile.png`. |
| AC-S04 | PASS | `tests/authService.test.mjs` couvre traduction FR, succès, confirmation, session, abonnement et mode local ; client unique, `public`, callback web seulement et retries désactivés. E2E callback de session puis déconnexion vers l’écran d’authentification. |
| AC-S05 | PASS | Test d’empreinte du contrat MCP public généré, alias dérivés, schéma obligatoire et fichier préservé si erreur ; `typecheck` PASS. Documentation maintient `public` jusqu’à L6. |
| AC-S06 | PASS | Harness strict ci-dessus ; fiche projet = 40 lignes. Audit C1–C12 actualisé, écarts distants et limites non exécutées explicités. Revue indépendante APPROVE signalée par l’orchestrateur. |

Constat UI : l’alerte d’indisponibilité est en français et le compte en cache reste visible avec réglages après rechargement ; le parcours callback/logout est vert. Pas d’erreur console/page ou HTTP 5xx inattendue dans les 15 E2E. Aucune mutation distante, modification applicative ou commit QA. Preview arrêtée ; ports 4173–4175 fermés.
Limite acceptée et documentée : la file de commandes n’est pas persistante après fermeture ; une suppression échouée doit être retentée avant Pull. Les erreurs réseau restent visibles et le hook garde l’élément présent pour permettre cette nouvelle tentative.
