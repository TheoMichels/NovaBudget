# Build Report — local-browser-storage

- **Statut** : READY_FOR_QA
- **Cycle** : 2 (correction QA 1 ; livraison initiale conservée ci-dessous)
- **Branche / workspace** : feature/local-browser-storage / /Users/theomichels/App/NovaBudget
- Commit laissé à l’orchestrateur sur consigne explicite ; aucun push/déploiement.

## Fichiers créés / modifiés
| Fichier | Rôle | Dans le périmètre ? |
|---|---|---|
| src/components/UnifiedEvolutionChart.tsx (cycle correction 1) | Graduations selon largeur/longueur, dates extrêmes et interactions préservées | Oui, extension explicite AC-06 |
| app.config.js ; src/config/storageMode.ts | Mode incorporé au build Vercel, exclusion vercel dev et loopback | Oui |
| src/services/supabaseClient.ts | Aucune instance client créée en local, même avec clés | Oui |
| App.tsx ; src/hooks/useAuth.ts | Dashboard local sans session inventée ni initialisation auth | Oui |
| src/hooks/useSavings.ts ; useExpenses.ts ; useProjections.ts ; useSafetyCushion.ts | Chargement repositories local sans uid ; chemin cloud conservé | Oui |
| src/components/Header.tsx | Badge local non interactif, contrôles/modal cloud non montés | Oui |
| package.json ; package-lock.json ; eslint.config.js ; playwright.config.ts ; .agents/harness.config | Typecheck/lint/preview/E2E et dépendances ; build --clear ; port dev stable 8081 | Oui |
| tests/storageMode.test.mjs ; tests/projectsRepository.test.mjs ; tests/helpers/load-typescript.mjs | Tests sur vrais modules TS, configuration Expo réelle et logique repository | Oui |
| e2e/fixtures.ts ; e2e/local-storage.spec.ts ; e2e/cloud-mode.spec.ts ; scripts/prepare-test-builds.mjs | Navigateur réel, garde-console, trois exports synthétiques | Oui |
| .env.example ; .gitignore ; docs/LOCAL_STORAGE.md | Documentation, séparation clés client/serveur, données runtime ignorées | Oui |
| test-contract.md ; build-report.md ; builder-screenshots/* | Passation et preuves builder | Oui |

AGENTS.md et docs/AUDIT_STANDARDS.md préexistants préservés ; AGENTS complété par orchestrateur. Aucun fichier hors périmètre modifié par le builder. Aucun repository ni authService/syncService modifié.

## Données
- Changement de schéma : **non**. Aucune migration modifiée/créée, aucune commande distante exécutée.
- AsyncStorage et clés `@novabudget_*_v3` conservés. La désactivation du client suffit à activer les chemins locaux existants.
- Local : user et session restent null ; les hooks appellent les repositories sans uid, sans fausse identité.
- Les tests préchargent uniquement des données synthétiques dans un contexte Chromium neuf ; aucune lecture de profil navigateur réel.
- Les bundles E2E utilisent EXPO_NO_DOTENV=1 et des clés factices. Origine distante virtuelle interceptée vers localhost ; endpoints cloud simulés. Script qa-browser-inspect jamais exécuté.

## Harness (`.agents/state/verify-result.json`)
Exécution effective : `bash /Users/theomichels/.agents/skills/autonomous-qa/scripts/verify-harness.sh --strict`, code **0**, 2026-10-15T19:47:28Z.

| typecheck | lint | unit | build | e2e |
|---|---|---|---|---|
| PASS | PASS (44 warnings) | PASS (12 tests) | PASS | PASS (6 tests) |

Aucune étape sautée. Logs : `.agents/state/logs/{typecheck,lint,unit,build,e2e}.log`.
Après ce harness, seuls le viewport desktop (1440×1000), une assertion UI du versement après reload et la documentation ont été précisés ; aucune modification applicative. Contrôle final `npx playwright test && npm run typecheck` : code **0**, **6 passed (5.5s)** puis typecheck vert. QA doit relancer le harness sur l’état final.

Sortie finale E2E :
```text
✓ AC-03 Vercel distant sans clés reste sur la connexion avec erreur de configuration
✓ AC-03 Vercel distant avec clés nécessite une session
✓ AC-03/04 Vercel avec session synthétique conserve ses actions cloud
✓ AC-03 build Vercel servi sur localhost reste local
✓ AC-01/02/04 local CRUD and settings survive reload with no Supabase network
✓ AC-04 mobile 375px badge is readable without cloud actions or overflow
6 passed (5.5s)
```
Ports 4173, 4174 et 4175 libérés automatiquement par Playwright ; `lsof` ne retourne aucun listener à la fin.

## Défauts corrigés
- Client créé localement si clés présentes : garde du mode avant createClient.
- Dashboard/hooks auparavant verrouillés sans utilisateur : chemin local explicite conservant les repositories.
- Export Vercel servi sur loopback : priorité au mode local.
- Cache Metro réutilisant l’ancien manifest Expo entre exports : `--clear` dans build et exports de tests ; les bundles local/cloud/cloud sans clés sont désormais distincts.

## Tests du contrat contestés
Aucun. Corrections de sélecteurs E2E uniquement : attendre disparition des modales animées et cibler les actions des lignes plutôt que les titres également présents dans le graphique.

## Choix techniques & points d’attention
- `VERCEL=1` sélectionne le mode Supabase au build, sauf `VERCEL_ENV=development`. `NODE_ENV` et présence des clés seuls ne l’activent pas. Config Expo réelle testée pour production/preview/dev/hors Vercel.
- Localhost, sous-domaines localhost, trailing dot, 127/8 et ::1 restent locaux. Build distant sans clés reste derrière AuthScreen.
- Le stockage reste par origine/navigateur/profil, documenté. Export 4173 et dev 8081 ont des caches distincts.
- Skills fullstack-builder, test-architect et checklist React best-practices appliqués. Pas de nouvel écran, mutation du schéma ou refonte des erreurs existantes.
- Lint : adoption initiale approuvée par orchestrateur des règles react/no-unescaped-entities et react-hooks/set-state-in-effect en **warning**, sans neutraliser les autres règles. `npm run lint` exécute le périmètre applicatif Expo, 44 warnings / 0 erreur : 41 sur fichiers antérieurs, 3 sur les nouveaux appels async load des hooks dans leurs effets. Les 15 fichiers préexistants concernés sont AddSavingsModal, ExpensesSection, MonthYearCalendar, SavingsSection, SimulatorWaterfall, UnifiedEvolutionChart, UnifiedManagementSections, AddInflowModal, AddProjectModal, FutureProjectsSection, InflowsSection, MonthlySavingsController, ProjectionChart, ProjectionKpiCards, SmartRecommendationCard ; les 3 hooks sont useSavings/useExpenses/useProjections. Un import inutilisé de useAuth corrigé.
- Diagnostic facultatif `npx eslint .` (plus large que Expo, inclut les scripts .mjs) : erreur préexistante no-undef Buffer dans scripts/qa-browser-inspect.mjs. Fichier hors périmètre laissé intact et jamais exécuté ; cela n’est pas masqué comme un contrôle PASS.
- npm a signalé 28 vulnérabilités dans l’arbre installé ; pas de mise à jour forcée ni d’audit de sécurité complet dans cette mission.
- Jest non ajouté : hooks exercés via le vrai navigateur ; node:test conservé et nouveaux tests chargent le vrai TS via le compilateur existant. La fabrique createClient est substituée dans les tests unitaires client, les imports mode/client sont réels. E2E utilise le vrai SDK contre réponses réseau synthétiques.

## Acceptation et preuves d’exécution
| AC du plan | Implémentation | Test / contrôle effectif | Résultat réel / preuve | Limite / QA |
|---|---|---|---|---|
| AC-01 | storageMode ; supabaseClient ; useAuth ; App | storageMode.test.mjs local avec/sans clés ; E2E dashboard + session expirée synthétique + écoute réseau | PASS, client null local ; aucune requête Supabase durant le parcours ; garde-console vide | Réseau observé uniquement sur profils synthétiques locaux ; QA indépendant requis |
| AC-02 | hooks métiers ; repositories inchangés | E2E crée épargne/dépense/rentrée, +100 versement, matelas 12345, reload ; vérifie UI 900 € + valeurs et lignes ; supprime les 3 éléments et reload ; conserve compte/projet historiques | PASS, stockage navigateur réel ; projet historique préchargé dans vraie clé puis affiché après reload | CRUD projet futur non exposé effectué par test logique repository avec stockage mémoire, ne prouve pas une intégration stockage réelle |
| AC-03 | app.config.js ; storageMode ; client | Test vraie configuration ; export Vercel distant simulé avec/sans clés, avec session synthétique, loopback | PASS, AuthScreen sans session ; erreur sans clés ; actions cloud avec session ; local sur loopback | Aucun compte réel, aucun test serveur Supabase/RLS/production revendiqué |
| AC-04 | Header | Navigateur 1440×1000 et 375×812 ; badge complet/non tronqué ; pas d’action cloud locale ; actions cloud présentes en session distante simulée | PASS ; builder-screenshots/desktop.png et mobile.png | QA doit inspection visuelle indépendante ; seuls changements de Header |
| AC-05 | .gitignore ; docs ; aucune mutation schéma | git check-ignore confirme .agents/state/test-builds/local/index.html, test-results/local-mobile.png, .env.local ; diff des fichiers ; cache historique E2E | PASS, aucune commande distante ni suppression cache ; git diff --check passé | Données locales effaçables par navigateur, pas de sauvegarde multi-appareil ajoutée |

- **Intégrations stockage exécutées** : parcours E2E complet au sein de l’étape e2e du harness (hooks → vrais repositories → vrai AsyncStorage web → rechargement navigateur). Aucune étape integration autonome inventée ; le test logique repository est dans unit et identifié comme stockage substitué.
- **Unit** : 12 tests PASS : 7 conservés, 5 nouveaux sur vrais modules applicatifs/configuration/repository. Sortie réelle `.agents/state/logs/unit.log`.
- **Preuve rouge/vert** : avant code, `npm test` a donné 8 PASS / 2 FAIL, tous deux pour comportement absent : actual `{testClient:true}` vs expected `null`, cas local avec clés et cas Vercel loopback. Après correction : 10 PASS, puis 12 PASS après ajout configuration réelle et repository. Aucun échec runner de configuration présenté comme reproduction.
- **Décisions modifiant les AC** : aucune. Raffinement vercel dev demandé par orchestrateur, mêmes AC.
- **À vérifier par QA** : matrice entière de manière indépendante, captures finales et reprise du harness final ; aucune vérification manuelle laissée à l’utilisateur.


## Cycle de correction QA 1 — AC-06
**État courant : READY_FOR_QA.** Rapport QA FAIL lu intégralement avant livraison et conservé dans `qa-report-cycle-1.md` ; captures originales `screens/qa-mobile-tick-overlap.jpg` et autres `screens/qa-*` intactes. AC-01..05 restent inchangés et étaient tous PASS dans ce rapport indépendant.

### Défaut D1 et correction minimale
- QA : dates Sept.29 / Oct.29 en collision de 24.3615 px à 375 px ; défaut préexistant, désormais bloquant selon AC-06 ajouté par orchestrateur.
- Fichiers applicatifs touchés dans ce cycle : **seulement** `src/components/UnifiedEvolutionChart.tsx`. Test touché : **seulement** `e2e/local-storage.spec.ts`. Contrat, ui-spec et rapport complétés dans le périmètre autorisé.
- La cadence fixe modulo est remplacée par des indices répartis sur tout l’horizon. Leur nombre dépend de innerWidth (layout mesuré) et de la longueur du texte le plus large, avec réserve pour graisse et espacement ; maximum 7 graduations. Les première et dernière dates restent présentes. Ancres début/fin sur les textes extrêmes pour préserver leur lisibilité dans la zone du graphique.
- Seuls visibilité et ancrage des textes, plus testIDs de la zone/ticks, sont modifiés. Aucun changement aux données, calculs, courbes, horizon, coordonnées des points ou handlers de sélection/drag. Checklist React : pas de nouveau hook conditionnel, valeur dérivée bornée sur la série existante, aucun any, identifiants stables.

### Preuve rouge / verte honnête
Avant correction, nouveau test réel des rectangles SVG :
- 375 px, départ octobre : **FAIL** Sept.29 / Oct.29, écart **-24.3654 px**.
- 375 px, départ septembre (libellés plus longs) : **FAIL** Août29 / Sept.29, écart **-25.9045 px**.
- 1440 px, départ septembre : **FAIL** Août29 / Sept.29, écart **-0.9323 px**.
- Cas 1440 px octobre : timeout du sélecteur XPath d’ancêtre SVG (namespace), **pas présenté comme preuve du défaut**. Sélecteur de zone corrigé avec testID ; aucune assertion géométrique affaiblie.

Après correction : `npm run test:e2e -- --grep AC-06`, **4 passed (3.9s)**. Tests de rectangles réels pour octobre/septembre ×375/1440, puis sélection du départ (0 €, badge Point de départ), glissement vers le dernier mois et retour au mois initial index12 avec date/capital identiques ; rectangles revérifiés à chaque étape. Le clic/drag réel utilise les coordonnées de la zone qui reçoit déjà les événements, sans simulation de callback.

### Harness final du cycle
Commande : `bash /Users/theomichels/.agents/skills/autonomous-qa/scripts/verify-harness.sh --strict`, **code 0**, timestamp **2026-10-15T19:57:00Z**. Les logs `.agents/state/logs/*` correspondent maintenant à cette relance.

| typecheck | lint | unit | build | e2e |
|---|---|---|---|---|
| PASS | PASS (44 warnings, baseline inchangée) | PASS (12 tests) | PASS | PASS (**10 tests, 8.3s**) |

Aucune étape sautée. Suite de 10 = 6 parcours initiaux conservés + 4 nouveaux AC-06. Après le harness, seule l’assertion de date du dernier mois a été renforcée vers le libellé exact Octobre/Septembre 2029 (au lieu de simplement différente du mois initial) ; aucune modification applicative. Relance ciblée finale `npx playwright test e2e/local-storage.spec.ts --grep AC-06` : **4 passed (3.5s)**, code 0.

| AC | Implémentation | Contrôle exécuté | Résultat / preuve | Limite / suite |
|---|---|---|---|---|
| AC-06 | UnifiedEvolutionChart.tsx, sélection des indices + ancres de labels uniquement | 4 E2E réels, rectangles de tous les labels SVG aux deux largeurs, première/dernière date, sélection début/dernier mois exact/retour index12 | PASS, sorties réelles ci-dessus et `.agents/state/logs/e2e.log` ; captures runtime `test-results/ticks-{375,1440}-{october,september}.png` ; capture mobile octobre ouverte avec view_image et labels distincts | Estimation conservatrice de largeur pour dates françaises système à 10 px, testée par rectangles réellement rendus ; inspection visuelle indépendante QA encore requise. Aucun nouveau comportement produit |

- Capture du graphique seul, y compris axe X sous le pli, ajoutée aux quatre tests ; preuve initiale QA préservée séparément.
- `git diff --check` : code 0. Ports 4173/4174/4175 libres après tests (`lsof` aucun listener).
- Pas de nouveau package, migration, commande distante, modification de stockage/auth, commit ou push dans ce cycle.
