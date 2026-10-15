# QA Report — local-browser-storage

VERDICT: FAIL

- **Date** : 2026-10-15, inspection après harness 19:50:27 UTC.
- **Cycle** : contrôle initial, puis transmission au cycle de correction 1/5.
- **Commit inspecté** : 54e4c78, branche feature/local-browser-storage, modifications finales non commitées.
- **Mode d’inspection** : QA indépendante ; navigateur réel Codex CUA, puis lecture visuelle des captures avec view_image. Les captures Playwright proviennent de ma relance du harness, pas du builder.
- **Documents lus** : AGENTS.md, harness.config, implementation_plan.md (y compris ajout AC-06 par orchestrateur après découverte), ui-spec.md, test-contract.md, build-report.md, review-report.md (APPROVE).
- Aucun fichier applicatif, test ou configuration modifié. Aucune connexion à un compte réel, aucune commande distante, aucun accès production. scripts/qa-browser-inspect.mjs jamais exécuté.

## 1. Harness strict
Commande : `bash /Users/theomichels/.agents/skills/autonomous-qa/scripts/verify-harness.sh --strict`.

| Étape | Statut | Détail |
|---|---|---|
| typecheck | PASS | tsc --noEmit, code 0 |
| lint | PASS | Expo lint, 44 warnings / 0 erreur, baseline adoptée par orchestrateur |
| unit | PASS | 12 tests, 0 FAIL, 0 SKIPPED |
| build | PASS | Export Expo web effectif |
| e2e | PASS | 6 parcours Chromium réels, 6.2 s |

Preuve : `.agents/state/verify-result.json`, timestamp `2026-10-15T19:50:27Z`, status PASS ; `.agents/state/logs/{typecheck,lint,unit,build,e2e}.log`. Aucune étape sautée. Premier essai empêché avant exécution par protection sandbox du dossier de logs ; relance autorisée avec écriture effective et succès. Ce problème d’environnement n’est pas un défaut applicatif.

## 2. Parcours
| Parcours | Résultat | Remarque |
|---|---|---|
| Local desktop 1440×1000, dashboard sans session | PASS | Badge, états vides, ajout épargne sans connexion |
| Local création/reload/suppression | PASS | CUA : épargne « Épargne QA indépendante », 2500 €, présente après reload puis supprimée après reload ; E2E étend à dépense/rentrée/réglages/cache historique |
| Local mobile 375×812 | FAIL | Badge lisible, aucun débordement horizontal ; chevauchement des dates Sept.29 et Oct.29 dans le graphique |
| Formulaire invalide | PASS | Enregistrer un compte vide affiche « Veuillez renseigner un nom pour ce compte. », sans création |
| Cloud Vercel distant synthétique | PASS | E2E avec/sans clés et session ; aucun endpoint production utilisé |
| Build Vercel sur localhost | PASS | Dashboard local, zéro requête Supabase |

## 3. Contrôles transverses
- Persistance après rechargement : PASS, vraie frontière hooks → repositories → AsyncStorage web → reload ; assertions UI et clés réelles.
- État vide : PASS (aucun compte/dépense/rentrée), erreur de saisie : PASS via CUA et capture ; erreur cloud sans clés : PASS E2E. Chargement local sans attente d’auth : dashboard accessible ; aucune bannière/skeleton nouveau requis par ui-spec.
- Console : zéro erreur rouge collectée par les six fixtures E2E et par `tab.dev.logs({levels:['error']})` à la fin des interactions CUA.
- Réseau : zéro requête Supabase dans le parcours local surveillé ; aucune réponse 4xx/5xx inattendue signalée par la console navigateur, garde E2E 5xx vide. La fixture n’a pas de garde indépendante de tous les 4xx ; aucune preuve serveur production/RLS revendiquée.
- Responsive : documentWidth = innerWidth = 375 via CUA ; badge complet et non interactif aux deux dimensions. Échec visuel ciblé ci-dessous. À 1440, pas d’intersection géométrique entre les deux dernières dates (écart 0.61 px).
- Preview lancée par start-preview.sh sur `http://localhost:4173`, arrêtée par stop-preview.sh. PID supprimé ; aucun listener sur 4173, 4174, 4175 à la fin. Onglet CUA fermé et viewport réinitialisé.

## 4. Défauts
| # | Gravité | Parcours | Reproduction | Attendu | Observé | Capture |
|---|---|---|---|---|---|---|
| D1 | Majeur pour lisibilité, bloquant pour verdict QA selon règle transverse explicite et AC-06 | Dashboard mobile, axe X de UnifiedEvolutionChart | Ouvrir preview locale, viewport 375×812, attendre layout stabilisé, descendre sur le graphique ; défaut visible avec état vide ou compte synthétique | Dates lisibles sans intersection, dates extrêmes conservées | Sept.29 et Oct.29 superposés en bas à droite du graphique | screens/qa-mobile-tick-overlap.jpg |

Mesures DOM CUA avant scroll (mêmes coordonnées verticales y=813.5..825) :
- Sept.29 : x=314.1897..348.0881, largeur 33.8984 px.
- Oct.29 : x=323.7266..354.2734, largeur 30.5469 px.
- Intersection horizontale de 24.3615 px, donc chevauchement confirmé visuellement et géométriquement.

Le défaut est **préexistant et hors du changement stockage** : `git diff -- src/components/UnifiedEvolutionChart.tsx` est vide lors de cette inspection. Il ne constitue aucune régression démontrée du stockage. Toutefois l’instruction QA « Critères de FAIL (non négociables) : ... un chevauchement visuel ... » impose FAIL ; l’orchestrateur a tracé la correction minimale et AC-06 dans le plan. AC-01..05 restent PASS.

## 5. Diagnostic actionnable
Cause probable : `src/components/UnifiedEvolutionChart.tsx`, bloc « X Axis Date Labels », lignes autour de 509–540. La règle `i === maxIndex || i % stepInterval === 0` conserve une graduation périodique immédiatement avant la dernière, sans contrôle de l’espace disponible. Le centrage des deux textes ne peut pas tenir à 375 px.
Correction ciblée à réaliser par builder : sélection/espacement des graduations visibles selon la place, garder première et dernière dates ; conserver les valeurs, l’horizon et la sélection de mois. Ajouter assertion navigateur sur rectangles sans intersection aux deux largeurs et vérification des extrêmes/sélection. Aucun code changé par QA.

## 6. Captures
- `screens/qa-mobile-tick-overlap.jpg` : CUA, preuve exacte D1, compte QA synthétique avant suppression.
- `screens/qa-mobile-validation.jpg` : CUA, erreur de nom vide, lisible à 375 px.
- `screens/qa-desktop-cua.jpg` : CUA, dashboard vide desktop 1440 après suppression et reload.
- `screens/qa-desktop-1440.png`, `screens/qa-mobile-375.png` : captures de ma relance E2E. La capture mobile initiale ne montre pas tout l’axe X sous le pli ; la capture CUA défilée apporte la preuve manquante.
Toutes les captures citées ont été ouvertes/contrôlées visuellement ; aucune donnée utilisateur réelle.

## Acceptation — vérification indépendante de chaque AC
Plan de référence : implementation_plan.md. AC-06 ajouté par orchestrateur après découverte, sans modification des cinq AC initiaux.

| AC | Attendu | Test / contrôle exécuté | Résultat | Preuve précise | Limites |
|---|---|---|---|---|---|
| AC-01 | Local avec/sans clés et ancienne session : dashboard, zéro Supabase | Assertions vrais modules tests/storageMode.test.mjs inspectées et exécutées ; E2E session périmée, interception Supabase ; CUA dashboard sans session | PASS | unit.log : « AC-01 local default never constructs Supabase even with keys » ; e2e.log parcours local PASS ; badge CUA | Client fabriqué substitué en unit ; navigateur réel dans E2E ; profil synthétique |
| AC-02 | CRUD épargne/dépense/rentrée, versement/matelas conservés et suppression persistée | E2E local actions UI + reload, assertions 900 €, matelas 12345, suppression des trois lignes + reload ; CUA épargne 2500/reload/suppression ; repository projets | PASS | e2e/local-storage.spec.ts test « AC-01/02/04 local CRUD and settings survive reload with no Supabase network » PASS ; unit « AC-02 future projects CRUD uses existing local cache without user or cloud » PASS | CRUD projet via adaptateur mémoire (pas intégration navigateur) ; projet historique dans vraie clé web visible après reload |
| AC-03 | Vercel distant authentifié, sans clés fermé ; hors Vercel et loopback locaux | Tests vrai app.config.js, client et variantes loopback ; quatre E2E cloud sans clés/sans session/avec session/loopback | PASS | unit.log 3 cas AC-03 PASS ; e2e.log 4 cas AC-03 PASS, assertions absence dashboard sans session/clés inspectées | Build/origine distante virtuels, endpoints simulés ; aucune preuve compte réel ni RLS |
| AC-04 | Badge local, aucune action cloud locale ; actions cloud conservées sur Vercel | E2E 1440 et 375, CUA aux deux dimensions ; cloud session synthétique, actions compte/déconnexion présentes, badge absent | PASS | Capture qa-desktop-cua.jpg, qa-mobile-375.png ; e2e.log 6 PASS ; badge non tronqué et absence contrôles vérifiés | Chevauchement D1 du graphique séparé d’AC-04 et traité par AC-06 |
| AC-05 | Runtime hors Git, documentation correcte, pas de migration/écriture distante, cache conservé | git diff/check-ignore, lecture docs/LOCAL_STORAGE.md et .gitignore, clés préexistantes compte/projet dans E2E | PASS | git diff --check code 0 ; check-ignore retourne .agents/state/test-builds/local/index.html, test-results/local-mobile.png, .env.local ; diff migrations/repos/authService/syncService vide ; compte/projet visibles après reload E2E | Données propres à origine/profil et effaçables : documenté ; aucune copie de données réelles |
| AC-06 | Dates axe X sans chevauchement à 375/1440, extrêmes et sélection/valeurs conservées | CUA capture stabilisée et rectangles SVG aux deux dimensions ; lecture bloc labels actuel | FAIL | D1, capture qa-mobile-tick-overlap.jpg, intersection 24.36 px à 375 ; pas d’intersection à 1440 | Premier défaut suffit à invalider le critère ; sélection/calculs à revérifier après correctif |

Intégration réellement exécutée : E2E du harness couvre stockage navigateur via hooks et repositories réels, rechargement et suppression ; aucun test mémoire présenté comme stockage navigateur. La reproduction initiale client créé en local est couverte par les assertions unitaires sur vrais modules et les parcours réseau ; les deux cas anciennement rouges passent. Le défaut D1 n’est pas corrigé par QA et nécessite une nouvelle inspection sur l’état final.
