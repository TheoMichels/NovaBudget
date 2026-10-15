# UI Spec — local-browser-storage

## Parcours
1. **Local** : ouvrir l’application → dashboard existant → badge « Stockage local » dans le Header ; aucune action connexion, déconnexion ou synchronisation cloud.
2. **Cloud Vercel** : conserver authentification, Header et actions cloud existants ; badge local absent.

Le mode est fourni par la configuration du plan, sans réglage utilisateur supplémentaire.

## Écrans & composants
| Composant | Fichier builder | Modification | Rôle |
|---|---|---|---|
| Header existant | `src/components/Header.tsx` | Minimale | Remplacer le groupe d’actions cloud par un texte local ; conserver marque et disposition |
| AuthModal | Point de montage dans Header | Garde cloud | Aucun montage ni déclencheur en local |
| Dashboard existant | `App.tsx` | Accès local selon plan | Présentation et interactions conservées |

## États
| Vue | Loading | Empty | Error | Populated |
|---|---|---|---|---|
| Badge statique | Visible dès montage du Header, aucun chargement propre | Même libellé sans données | Indique le mode, jamais la réussite d’une sauvegarde | Même libellé avec données |
| Dashboard | Pas d’attente de session cloud en local (AC-01) | États vides et CTA existants conservés | Retours existants conservés, aucune demande de connexion locale | Cartes, graphique, sections et modales existants conservés |
| Header cloud | Parcours existant | Session existante | Auth/configuration selon AC-03 | Actions existantes, badge local absent |

Aucun nouvel état dynamique n’est ajouté : pas de skeleton, bannière ou écran supplémentaire pour ce badge statique.

## Tokens utilisés
- Expo : `StyleSheet.create` et `src/theme/colors.ts` ; aucun nouveau token.
- Badge : fond `colors.primaryBackground`, texte `colors.textSecondary`, bordure `colors.borderStrong`.
- Forme du badge existant : bordure 1, rayon 12, padding horizontal 10 / vertical 6, texte 11 px / 700 ; sous 400 px : rayon 10, padding 8 / 5.
- Conserver surfaces, marque et ombres du Header existant.

## Squelette JSX documentaire
À l’emplacement actuel de `renderActions()`, avec le mode fourni par l’implémentation :

```tsx
{storageMode === "local" ? (
  <View style={styles.localBadge}>
    <Text testID="storage-mode-badge" style={styles.localBadgeText} numberOfLines={1}>
      Stockage local
    </Text>
  </View>
) : renderActions()}
```

Styles `localBadge` / `localBadgeText` selon les tokens et dimensions ci-dessus. Garde conditionnelle cloud autour du montage AuthModal. Aucun composant nouveau requis ; aucun accès aux données dans la présentation. Badge non interactif : pas de `Pressable`, handler, rôle bouton, focus clavier ou curseur pointeur. Pas de puce verte évoquant une connexion.

## testID
| testID | Élément | Écran |
|---|---|---|
| `storage-mode-badge` | Texte complet « Stockage local », présent seulement en local | Header |

Vérifier aussi l’absence locale des contrôles « Gérer mon compte et synchronisation » et « Se déconnecter » par rôle/libellé ; ne pas simplement les masquer par styles. AuthModal ne peut pas être ouvert en local.

## Responsive
- **375 px** : disposition existante sur une ligne, logo 32, marque 16, sous-titre masqué. Badge compact et texte complet ; ne pas reprendre la limite email `maxWidth: 84` qui pourrait le tronquer. Aucun débordement horizontal.
- **1440 px** : marque/sous-titre à gauche, badge intrinsèque à droite à la place des actions ; dashboard inchangé.
- Contrôle mental réalisé aux deux largeurs ; contrôle navigateur final par QA.

## Points ouverts pour le builder
Aucun choix produit ouvert. Utiliser la source unique de mode du plan. Livrable documentaire seulement, aucun fichier applicatif modifié.

## Correspondance avec les critères d’acceptation
Plan de référence : `implementation_plan.md`.

| AC | Parcours / état UI | Résultat observable | testID concernés |
|---|---|---|---|
| AC-04 | Local, tous états, 375 / 1440 px | Badge complet non interactif ; aucune action ou modale cloud accessible | `storage-mode-badge` |
| AC-04 | Cloud Vercel | Badge local absent ; actions existantes conservées | `storage-mode-badge` absent ; rôles/libellés existants |
| AC-01 / AC-02 | Dashboard local | Utilisation sans connexion ; badge stable pendant création et rechargement | `storage-mode-badge` (indicateur seulement) |

## Vérification technique
Squelette dans Markdown uniquement ; aucun fichier TypeScript modifié. Résultat `npx tsc --noEmit` transmis à l’orchestrateur.

## Correction QA — AC-06
- Écran existant, axe X uniquement : choisir le nombre et l’espacement des graduations selon largeur disponible et longueur des libellés, conserver première et dernière dates.
- Conserver taille 10 px, palette, courbes, données, horizon, marqueurs et interactions ; aucune modification des états loading/empty/error/populated existants.
- Contrôle navigateur à 375 et 1440 px : rectangles réels sans collision, y compris avec septembre/janvier plus longs. Sélection du début/fin/milieu et retour au mois initial inchangée.
- Ajouts d’identifiants éventuels : `projection-chart` (zone interactive), `chart-x-tick-<index>` (texte SVG de graduation), sans renommer les identifiants préexistants.

### Détail de la correction AC-06 livrée
- Graduations réparties entre 0 et maxIndex ; nombre limité par largeur disponible et longueur maximale des labels français, plafond7. À375, quatre dates espacées sur la série de37 points ; données mensuelles intégrales inchangées.
- Première date ancrée au début de son texte, dernière à la fin ; graduations intermédiaires centrées. Taille10 et couleurs/gras de sélection existants conservés.
- testIDs ajoutés : `projection-chart`, `chart-x-tick-<index>`. Contrôle réel rectangles + interactions : quatre E2E PASS ; QA visuelle indépendante à refaire.
