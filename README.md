# 🌿 NovaBudget

Application de gestion budgétaire, de suivi des épargnes et de simulation prévisionnelle à court et long terme.

## ✨ Fonctionnalités Clés

- **Gestion des Épargnes** :
  - Déclaration des différents supports d'épargne (Livret A, LDDS, PEA, Assurance-Vie...).
  - Suivi unifié et centralisé de tous vos comptes d'épargne.
  - Catégorisation : *Sécurité*, *Projet (moyen terme)* ou *Investissement (long terme)* avec suivi du taux de rendement.
- **Visualisation Globale & KPI Temps Réel** :
  - Épargne actuelle totale, intérêts annuels estimés, répartition par catégorie.
- **Planificateur de Dépenses Importantes & Projets Futurs** :
  - Renseignement des grands projets à venir (Vacances, Travaux, Véhicule, Fiscalité...).
  - Échéance prévisionnelle (mois/année) et impact sur la trésorerie.
- **Simulateur Prévisionnel ("What-If") & Trajectoire Long Terme** :
  - Calcul dynamique de l'épargne restante et projection pluriannuelle.
  - Effort d'épargne mensuel programmable et rentrées d'argent exceptionnelles.
  - Graphique d'évolution patrimoniale avec détection des points bas de trésorerie.
  - Case à cocher sur chaque dépense pour tester en direct différents scénarios sans supprimer le projet.
- **Architecture Offline-First** :
  - Stockage local robuste et instantané via `@react-native-async-storage/async-storage`.

---

## 🎨 Design & Ergonomie

- **Inspiration** : Même structure moderne, responsive et fluide que l'application `todo` (surfaces dépolies, coins arrondis 16-24px, micro-interactions).
- **Palette** : Alliance reposante et institutionnelle de **Blanc** et de **Vert Émeraude / Sauge** avec touches ambrées pour les dépenses prévues.

---

## 🚀 Démarrer l'application

### Lancer sur le Web :
```bash
npm run web
```
L'application s'ouvrira dans votre navigateur sur `http://localhost:8081` (ou port assigné par Expo).

### Lancer sur Mobile (Expo Go) :
```bash
npm start
```
Scannez le QR code avec l'application Expo Go sur iOS ou Android.

---

## 📁 Structure du Projet

```text
NovaBudget/
├── App.tsx                     # Vue principale & dashboard responsive
├── index.ts                    # Point d'entrée Expo
├── package.json                # Dépendances (Expo 57, React 19, React Native Web)
├── app.json                    # Configuration Expo
├── assets/                     # Icônes et favicons
└── src/
    ├── types/                  # Types TypeScript (savingsAccount, expense, filter)
    ├── theme/                  # Couleurs (blanc & vert), ombres et gradients
    ├── storage/                # Repositories AsyncStorage (savingsRepository, expenseRepository)
    ├── hooks/                  # Hooks React (useSavings, useExpenses, useForecast)
    └── components/             # Composants UI
        ├── Header.tsx              # Barre de navigation & filtre de profil
        ├── MetricCards.tsx         # Cartes KPI consolidées
        ├── SimulatorWaterfall.tsx  # Jauge et simulateur prévisionnel
        ├── SavingsSection.tsx      # Liste et gestion des épargnes
        ├── ExpensesSection.tsx     # Liste et pilotage interactif des dépenses
        ├── AddSavingsModal.tsx     # Formulaire d'ajout d'épargne
        └── AddExpenseModal.tsx     # Formulaire de planification de dépense
```
