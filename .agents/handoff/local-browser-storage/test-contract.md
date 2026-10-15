# Contrat de tests — local-browser-storage
Établi avant le code. Plan et UI spec lus ; aucun AC redéfini.

| AC | Niveau, fichier et vérification | Commande | Attendu / frontière |
|---|---|---|---|
| AC-01 | tests/storageMode.test.mjs : sélection via vrai module client (fabrique createClient substituée) ; e2e/local-storage.spec.ts : dashboard, ancienne session synthétique et surveillance réseau | npm test ; npm run test:e2e | Local avec/sans clés sans client et zéro requête Supabase ; browser réel |
| AC-02 | e2e/local-storage.spec.ts : CRUD UI épargne/dépense/rentrée, versement/matelas, reload, cache préexistant ; tests/projectsRepository.test.mjs : logique CRUD projet futur via vrai repository | idem | Persistance réelle AsyncStorage web ; logique repository projet : adaptateur mémoire substitué à AsyncStorage, repository réel et client null, ne prouve pas le navigateur |
| AC-03 | tests/storageMode.test.mjs : Vercel distant/cloud, boucle locale, hors Vercel ; e2e/cloud-mode.spec.ts : export Vercel synthétique avec/sans clés et accès verrouillé | idem | Origine distante interceptée et servie localement, aucun compte/donnée distante |
| AC-04 | e2e/local-storage.spec.ts : badge, absence contrôles cloud et mobile 375px ; e2e/cloud-mode.spec.ts : badge absent/auth visible | npm run test:e2e | Navigateur Chromium réel desktop/mobile |
| AC-05 | docs/LOCAL_STORAGE.md, .gitignore et contrôle git diff/check-ignore ; test cache existant intégré AC-02 | contrôle QA + git diff | Clés existantes conservées, aucun schéma ni commande distante |

Outillage : conserver node:test existant ; nouveaux tests importent du vrai TypeScript transpilé avec TypeScript, sans recopier logique applicative. Playwright pour parcours réels et garde console/pageerror dans fixtures. Aucun test React isolé requis : hooks exercés par le navigateur. ESLint Expo, typecheck et scripts harness configurés. Étape unit du harness = npm test inclut le test logique du repository ; aucune intégration stockage simulée déclarée comme réelle. Projet historique préchargé dans la vraie clé navigateur, visible après reload via E2E.

Preuve rouge à consigner avant implémentation ; si un défaut préalable empêche un parcours, signaler la limite sans affaiblir le contrat. Aucun test ne contacte Supabase réel. Builds tests utilisent EXPO_NO_DOTENV=1 et valeurs synthétiques.

## Preuve rouge avant code
`npm test` : 8 PASS / 2 FAIL le 15/10/2026. Le vrai module supabaseClient construisait le client avec clés en mode local, et sur localhost avec un build Vercel. Après correction : 10 PASS (puis extension contrat config réelle + repository). Aucun défaut de configuration runner lors du rouge.

## Exécution builder
Harness strict complet PASS (12 unit, 6 E2E), 2026-10-15T19:47:28Z. Extension finale assertion UI versement après reload + viewport 1440 : `npx playwright test && npm run typecheck`, code 0, 6 passed (5.5s). Les contrôles indépendants QA restent requis. Voir build-report.md.

## Cycle de correction 1 — AC-06 (avant code)
Plan étendu par l’orchestrateur ; AC-01..05 inchangés. Preuve QA initiale conservée : `screens/qa-mobile-tick-overlap.jpg` (Sept.29 / Oct.29) ; rapport QA en cours de finalisation lors du diagnostic.

| AC | Niveau / test | Commande | Attendu |
|---|---|---|---|
| AC-06 | e2e/local-storage.spec.ts : rectangles réels de tous les textes SVG de mois, à 375px et 1440px ; mois de départ octobre et septembre pour libellés longs ; sélection début/milieu/fin et retour au mois initial | npx playwright test e2e/local-storage.spec.ts --grep AC-06 ; harness strict final | Aucun rectangle adjacent ne se chevauche ; première/dernière dates présentes ; interaction sélection identique et valeurs 0 €/capital final non nul stables après retour |

Test écrit et exécuté contre le build avant correction ; la reproduction doit échouer sur collision géométrique, sans dépendre d’un nouveau testID absent. Le test utilise la vraie UI/SVG et le stockage réel (profil neuf), sans snapshot copié ou logique de ticks réimplémentée.

### Résultat AC-06 — cycle correction 1
Rapport indépendant initial conservé en qa-report-cycle-1.md, AC01..05 PASS / AC06 FAIL (collision 24.36px). Nouveau test avant code reproduit réellement les collisions : -24.3654px octobre375, -25.9045px septembre375, -0.9323px septembre1440. Le quatrième cas octobre1440 avait un timeout de sélecteur SVG (ne constitue pas une reproduction métier) ; corrigé par sélection de zone testID sans affaiblir les assertions.

Après code : 4 cas AC06 PASS. Harness strict final 2026-10-15T19:57:00Z : 5 étapes PASS, 12 unit, **10 E2E PASS (8.3s)**. Renforcement final de la date exacte du dernier mois puis relance ciblée : **4 passed (3.5s)**. Premier/dernier libellés et rectangles vérifiés, début0€/badge, dernier mois exact, retour au capital/date initiaux. Captures du graphique seul sous test-results/ticks-*.png, données synthétiques uniquement. QA indépendante finale requise.
