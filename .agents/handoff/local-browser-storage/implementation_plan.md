# Stockage local du navigateur / Supabase sur Vercel

## Cadrage et décision
Demande explicite : application locale autonome, données locales non versionnées, connexion Supabase réservée au déploiement Vercel. L'utilisateur a choisi le stockage persistant du navigateur (15/10/2026). Aucun choix produit ouvert.
Faits : AsyncStorage dans les repositories existe déjà ; client Supabase créé dès que les clés existent ; App et hooks bloquent sans utilisateur. Pas de nouveau schéma, pas de migration, pas de données de production à lire ou écrire.
Décision technique : sélectionner le mode cloud pendant le build Vercel (VERCEL=1) via configuration Expo ou script fiable, indépendamment de NODE_ENV et des seules clés. Toute exécution sur loopback reste locale, même avec un build cloud. Local par défaut (web/native/dev/export hors Vercel). Clés cloud absentes sur Vercel : conserver le verrou d'auth et erreur de configuration, ne pas basculer vers un dashboard ouvert.
Le stockage browser existant est par origine (protocole/hôte/port) ; conserver un port stable, ne pas effacer les clés existantes. Données absentes du dépôt par construction ; documenter l'effacement des données navigateur.

## Critères d'acceptation
| AC | Préconditions / action / résultat observable | Vérification |
|---|---|---|
| AC-01 | Démarrage local, clés Supabase présentes ou absentes : dashboard sans connexion ; zéro requête auth/rest/realtime Supabase, même avec ancienne session stockée. | Tests mode/client + E2E navigateur avec surveillance réseau et session périmée synthétique |
| AC-02 | Local : créer épargne, dépense, rentrée, modifier versement mensuel et matelas ; recharger même origine : données et paramètres conservés ; suppression persistée. | E2E actions UI et reload ; projets futurs via repository si non exposés dans UI |
| AC-03 | Build Vercel sur origine distante : mode Supabase actif, accès soumis à session ; sans clés : écran connexion/erreur, jamais dashboard local. Build production hors Vercel et loopback restent locaux. | Tests sélection mode/client + build Vercel simulé et navigateur cloud sans compte réel, endpoints Supabase simulés si nécessaire |
| AC-04 | Interface locale : badge « Stockage local », aucune action connexion/déconnexion/synchronisation cloud accessible ; interface Vercel conserve ses actions. | Navigateur desktop/mobile + tests |
| AC-05 | Données runtime hors Git ; documentation lancement local et configuration Vercel à jour ; aucune migration/écriture distante ; données préexistantes non effacées. | git diff/check-ignore, documentation, contrôle cache existant navigateur |

## Périmètre et responsabilités
Dossier : /Users/theomichels/App/NovaBudget ; branche feature/local-browser-storage. Préserver AGENTS.md modifié et docs/AUDIT_STANDARDS.md non suivis préexistants, ainsi que .agents/state existant.
Fast-track configuration + adaptation minimale du parcours existant, sans nouvel écran : designer (spécification badge), fullstack-builder (contrat/tests/outillage/implémentation), code-reviewer (mode/auth/diff), qa-inspector indépendant (harness+navigateur), orchestrateur (preuve et commit).
Autorisés builder : app.config.*, app.json si nécessaire, App.tsx, src/config/**, src/services/supabaseClient.ts, src/hooks/useAuth.ts, useSavings.ts, useExpenses.ts, useProjections.ts, useSafetyCushion.ts, src/components/Header.tsx, AuthModal.tsx seulement si garde locale nécessaire ; package.json/package-lock.json, config tests/lint/Playwright, tests/**, e2e/**, scripts de build/preview/tests nouveaux, .env.example, .gitignore, docs/LOCAL_STORAGE.md, .agents/harness.config et fichiers handoff de mission. Éviter authService/syncService sauf nécessité signalée (revue obligatoire). Repositories uniquement si nécessité prouvée et consignée.
Orchestrateur : compléments AGENTS.md, plan, état et preuve finale. Pas de push/déploiement.

## Risques et limites
Session historique locale ne doit jamais activer Supabase. Ne pas simuler une session utilisateur locale. Pas de contact production dans les tests. Ne pas exécuter scripts/qa-browser-inspect.mjs (génère une session de production). Outillage manquant à compléter proportionnellement avec tests sur vrai code. Vérifier intégrations dans étape unit effective. Rapporter défauts préexistants hors périmètre séparément.

## Ajustement après QA — cycle de correction 1
L'inspection mobile a identifié un chevauchement préexistant des deux derniers libellés de l'axe X de UnifiedEvolutionChart (à 375 px : Sept.29 / Oct.29). Le rôle qa-inspector impose l'absence de chevauchement comme critère transverse bloquant. Correction minimale autorisée par l'orchestrateur dans la boucle autonome : espacer/sélectionner les graduations visibles, sans modifier données, calculs, horizon ou interactions du graphique. Pas de refonte.
- Périmètre builder étendu : `src/components/UnifiedEvolutionChart.tsx`, assertion E2E de non-chevauchement des graduations, test-contract/build-report et ui-spec documentaire.
- AC-06 : Étant donné le dashboard local à 375 px puis 1440 px avec les projections existantes, quand le graphique est stabilisé, les libellés visibles de l'axe X ne se chevauchent pas, première et dernière dates restent présentes ; aucune modification des valeurs ou de l'interaction de sélection du mois. Vérification : rectangles de libellés SVG en navigateur réel + contrôle visuel QA + sélection avant/après.
- Les AC-01..05 restent inchangés ; défaut ancien hors stockage mais traité uniquement pour satisfaire le contrôle transversal QA. Aucune nouvelle décision produit ou modification de données.
