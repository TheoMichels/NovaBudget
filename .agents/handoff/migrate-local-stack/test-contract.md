# Contrat de tests — migrate-local-stack L1–L3
| AC | Niveau | Preuve | Commande |
|---|---|---|---|
| AC-01 | E2E + repo | local-storage.spec.ts CRUD/réglages/reload sans réseau ; projectsRepository.test.mjs | npm test ; npm run test:e2e |
| AC-02 | Repo + E2E | validation.test.mjs corruption toutes clés, historique sans updatedAt ; validation.spec.ts récupération et refus écriture | idem |
| AC-03 | Repo/schéma + E2E | validation.test.mjs nombres/formats/réponse cloud ; validation.spec.ts rejet négatif puis saisie valide persistée | idem |
| AC-04 | E2E + inspection QA | dashboard-error/empty/retry ; local-storage 375/1440 ; skeleton dashboard-loading à contrôler visuellement | npm run test:e2e ; QA navigateur |
| AC-05 | Harness | cloud-mode.spec.ts session synthétique/auth obligatoire/loopback ; typecheck/lint/unit/build/e2e | verify-harness.sh --strict |
| AC-06 | Documentaire QA | audit.md C1–C12 et project.md 40 lignes | inspection QA |
- Tests repositories : vraies fonctions TS avec adaptateur stockage mémoire substitué, pas une preuve d’intégration navigateur ; celle-ci est E2E avec vrai AsyncStorage.
- Rouge observé avant code : tests corruption/écriture et montants invalides échouaient ; historique valide passait.
- Tous les specs E2E utilisent fixtures.ts (garde console/pageerror), comptes synthétiques et stockage isolé.
- Aucune modification des assertions existantes pour obtenir PASS.
- Cycle 2 : supabaseConfig.test.mjs vérifie config sans client et absence d’import UI ; monthlyContribution.test.mjs reproduit deux incréments avant réponse cloud, rouge puis vert ; npm test = 22 PASS.
