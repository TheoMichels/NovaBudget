# Migration de la stack — base feature/local-browser-storage

## Périmètre et décisions
- Demande : converger vers le manuscrit stack-target.md depuis la branche existante ; conserver le mode navigateur et les données.
- Autorisation : changements locaux, tests et commits ; aucune écriture distante, push ou mise en production.
- Existant : Expo 57, React 19, AsyncStorage 3, modes local/cloud et E2E déjà présents. docs/AUDIT_STANDARDS.md est un fichier utilisateur non suivi, à préserver.
- Lots séquentiels : L1–L3 validation et robustesse locale ; L4 préparation Prisma et plan de bascule ; L5 ajustements cloud simulés si nécessaires. L6 requiert confirmation distincte.
- Risque principal : données anciennes/corrompues ; ne renommer ni vider les clés, ne jamais écraser silencieusement une valeur invalide.

## Critères d’acceptation du lot L1–L3
| AC | Précondition et action | Résultat observable | Vérification |
|---|---|---|---|
| AC-01 | Export local, ajout/modification/suppression des entités et réglages, rechargement | Données conservées aux mêmes clés, zéro appel Supabase et aucune auth | E2E local + intégration repositories |
| AC-02 | Lecture de JSON invalide, formes/types invalides ou données historiques valides | Validation Zod aux frontières ; erreur contrôlée sans écrasement de données ; valeurs historiques compatibles | Tests repositories et schémas |
| AC-03 | Saisie de formulaires ou réponse distante invalide | Validation Zod, aucune valeur invalide persistée ; messages en français | Unitaires et E2E ciblés |
| AC-04 | Démarrage et chargement du dashboard | États chargement/vide/erreur/données accessibles ; design conservé, tokens radius/spacing disponibles | Inspection UI 375/1440 et E2E |
| AC-05 | Build cloud simulé et exécution harness strict | Local/cloud isolés, parcours existants préservés ; typecheck/lint/unit/build/e2e PASS | Harness et QA indépendante |
| AC-06 | Consultation de l’audit et fiche projet | C1–C12 sourcés, écarts distants explicites ; fiche factuelle ≤40 lignes | Inspection documentaire QA |

## Exécution
- fullstack-builder : src/, App.tsx, package*.json, tests/, e2e/, scripts/ de test, .agents/project.md et handoff courant. Ne pas toucher prisma/ ou supabase/ dans ce lot.
- qa-inspector indépendant : vérification de chaque AC, harness strict et preuve navigateur ; code-reviewer si auth/sync modifiés.
- Pas de nettoyage de code mort sans nécessité, pas de refonte visuelle ; toute contradiction remonte à l’orchestrateur.
