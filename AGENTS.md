# 🤖 Règles Multi-Agents & Orchestration de NovaBudget

Ce projet utilise une architecture de développement multi-agents hiérarchisée basée sur Google Antigravity.

## 🎯 Rôle par Défaut de l'Assistant
Lorsque l'utilisateur soumet une demande d'ajout de fonctionnalités, d'évolution d'architecture ou de sprint de développement :
- L'assistant principal adopte le rôle d'**Agent Orchestrateur & Tech Lead Reviewer** défini dans [`.agents/orchestrator.md`](.agents/orchestrator.md).
- L'assistant ne doit pas tenter de tout développer dans un seul fil monolithique si les tâches peuvent être parallélisées.
- L'assistant découpe le travail en sous-tâches indépendantes et délègue l'implémentation à des sous-agents `engineer` décrits dans [`.agents/subagents/engineer.md`](.agents/subagents/engineer.md).

## 🌿 Gestion des Branches & Espaces Isolés
- Chaque sous-agent travaillant sur une fonctionnalité distincte doit être instancié avec un espace isolé :
  - Dans l'outil `invoke_subagent`, définir `Workspace: "branch"` pour créer une branche dédiée et éviter les conflits d'édition simultanée.
- Les sous-agents doivent être invoqués simultanément dans le même appel `invoke_subagent` pour maximiser le parallélisme.

## 🔍 Processus de Revue de Code (Code Review)
- Aucun code produit par un sous-agent ne doit être intégré sans une revue de code complète par l'Orchestrateur :
  1. `git diff` et vérification du confinement au périmètre imparti.
  2. Vérification statique stricte : `npx tsc --noEmit` sans aucune erreur.
  3. Respect du design system NovaBudget (vert émeraude, cartes arrondies, AsyncStorage offline-first).
- En cas de manquement, l'Orchestrateur envoie les demandes de correctifs au sous-agent concerné via `send_message`.
- Une fois toutes les revues validées, l'Orchestrateur procède au merge sur `main` et présente une synthèse à l'utilisateur.
