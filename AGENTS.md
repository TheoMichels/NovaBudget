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

