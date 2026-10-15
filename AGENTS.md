# FICHE D'IDENTITÉ DU PROJET (WORKSPACE AGENTS.md)
> Configuration spécifique pour NovaBudget.

## 1. CONTEXTE MÉTIER DE L'APPLICATION
- **Nom du projet** : NovaBudget
- **Objectif principal** : Application de gestion budgétaire, d'épargne et de projection financière à moyen et long terme (36 mois) avec calcul d'intérêts composés, rentrées prévues et dépenses planifiées.
- **Utilisateurs & Usage** : Usage personnel (Desktop / Mobile PWA local)

## 2. STACK & ARCHITECTURE LOCALE
- **Framework** : Expo SDK 57 (React Native Web, TypeScript strict)
- **UI / Design** : React Native StyleSheet natif, palette émeraude (`src/theme/colors.ts`), dégradés doux (`expo-linear-gradient`), graphe vectoriel interactif (`react-native-svg`).
- **Persistance des données** : Repository Pattern (`src/storage/`) avec AsyncStorage local et synchronisation Supabase / Prisma.
- **Port de développement local** : `http://localhost:8081`

## 3. COMMANDES CONCRÈTES DU HARNESS (OBLIGATOIRES POUR LES AGENTS)
- **Démarrer le serveur dev web** : `npm run web`
- **Vérifier le typage** : `npx tsc --noEmit`
- **Lancer les tests** : `npm run test`
- **Build Web** : `npm run build`
- **Commande globale du Harness** : `bash ~/.gemini/config/skills/autonomous-qa/scripts/verify-harness.sh`

## 4. RÈGLES SPÉCIFIQUES AU PROJET & MODÈLE DE DONNÉES
- Formatage monétaire : Euro français (ex: `1 250 €`) via `formatEuro`.
- Formatage des dates : Format français (ex: `Août 2026`) via `formatFrenchMonthYear`.
- Navigation fluide sans Cumulative Layout Shift (CLS) lors du déplacement du curseur temporel (0 à 36 mois).


## Stockage selon l'environnement
- En local (Expo, export hors Vercel, origine web loopback), stockage navigateur via les repositories existants, sans authentification ni requête Supabase. Les données restent propres au navigateur et à l'origine (hôte/port).
- Sur un build Vercel distant, authentification et synchronisation Supabase ; une configuration cloud absente ne doit jamais ouvrir le dashboard local.
- Ne pas utiliser la présence de clés Supabase ou NODE_ENV pour activer le cloud en local. Voir `docs/LOCAL_STORAGE.md` pour le lancement et les limites de persistance.

## Mode d'équipe
- Configuration et petites modifications sans nouvel écran : fast-track, cadrage/AC puis fullstack-builder et qa-inspector indépendant. Revue dédiée pour les modifications de sélection cloud/authentification.
- Nouvelles fonctionnalités majeures : séquentiel ; sprint de fonctionnalités indépendantes : parallèle, selon les instructions globales.

## Commandes de vérification et port de preview
- Typage : `npm run typecheck`.
- Lint : `npm run lint`.
- Tests unitaires et intégrations : `npm test`.
- Parcours navigateur : `npm run test:e2e`.
- Harness strict : `bash /Users/theomichels/.agents/skills/autonomous-qa/scripts/verify-harness.sh --strict`.
- Développement web local : `npm run web` ; conserver l'origine choisie pour retrouver les données.
- Port de preview QA : `4173`, configuration dans `.agents/harness.config` ; la preview et les tests servent le build web local.
