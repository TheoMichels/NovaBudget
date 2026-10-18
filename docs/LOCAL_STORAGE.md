# Lancer Nova en local

```sh
npm install
npm run web
```

Ouvrir `http://localhost:8081` : le tableau de bord est accessible immédiatement, sans compte ni clés Supabase. Le badge « Stockage local » indique ce mode. Les comptes, dépenses, rentrées, projets historiques, versements mensuels et matelas sont enregistrés dans le navigateur par les repositories AsyncStorage existants. Les clés `@nova_*_v3` sont utilisées ; aucune remise à zéro n'est effectuée.

Le stockage est propre à l'origine (protocole, hôte et port), au navigateur et au profil. Conserver la même adresse et le port 8081 pour retrouver ses données. Les données d'un ancien profil cloud déjà mises en cache restent visibles localement. Elles ne sont pas envoyées vers Supabase en local, même si une ancienne session ou des clés existent.

Pour inspecter ou supprimer ces données : outils de développement du navigateur → Application / Stockage → stockage local de l'origine → clés Nova. Effacer le stockage du site ou utiliser la navigation privée peut les supprimer. Elles ne sont pas écrites dans le dépôt Git. Il n'y a pas de synchronisation multi-appareil en mode local.

Pour prévisualiser un export statique : `npm run build`, puis `npm run preview` (`http://localhost:4173`). Cette origine a son propre stockage, distinct du serveur de développement. Le build vide le cache Metro pour actualiser la configuration incorporée.

# Vercel

Le build `npm run build` sélectionne Supabase seulement lorsque Vercel fournit `VERCEL=1` ; `VERCEL_ENV=development` (`vercel dev`) reste local. La configuration Expo embarque cette décision via `extra.storageMode`. Un export production fait hors Vercel reste local. Sur `localhost`, ses sous-domaines et les adresses loopback IPv4/IPv6, le navigateur reste toujours local, même avec un export Vercel.

Configurer les seules clés publiques client `EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_ANON_KEY` dans l'environnement Vercel concerné, puis reconstruire. Une build distante Vercel sans clés affiche la connexion et l'erreur de configuration : elle n'ouvre pas le dashboard local. Une build Vercel distante conserve authentification, synchronisation et déconnexion. Les variables doivent être présentes au build Expo. `NODE_ENV` ou la seule présence de clés n'activent jamais le cloud.

Les clés serveur/base listées dans `.env.example` concernent les scripts existants et ne doivent jamais être préfixées `EXPO_PUBLIC_`. Ce changement ne modifie aucun schéma ni aucune donnée distante.

# Vérifications

```sh
npm run typecheck
npm run lint
npm test
npm run test:e2e
```

Les tests E2E construisent trois exports synthétiques sous `.agents/state/test-builds/` et les servent sur 4173, 4174 et 4175. `EXPO_NO_DOTENV=1` exclut `.env` ; seules des clés factices sont incorporées. L'origine distante virtuelle `https://budget.example` est interceptée et servie depuis localhost. Les requêtes Supabase cloud sont simulées, sans compte réel. Chromium se prépare avec `npx playwright install chromium`. Les données, traces et exports de test sont ignorés par Git.

# Cache et synchronisation cloud (lot L5)

Les repositories conservent leurs interfaces et les six clés v3. `storage/cacheOnly.ts` gère uniquement le cache validé et sérialise ses écritures ; toutes les mutations métier Supabase passent par `services/syncService.ts`.
Le cache est écrit avant l’attente réseau. Les requêtes PostgREST sont bornées à 10 secondes et les retries automatiques du SDK sont désactivés : l’action Réessayer de l’interface contrôle la reprise et le cache n’attend pas les backoffs réseau cumulés. Les commandes cloud sont ordonnées pour préserver les modifications rapides et les suppressions confirmées ; chaque commande locale garde son propre jeton non confirmé, qu’un succès sur un autre élément ne peut pas effacer. Push confirme les seules écritures couvertes par son snapshot, jamais une suppression en échec. Les jetons ne persistent pas après fermeture et un Pull explicite peut remplacer les changements antérieurs ; les réponses de mutation ne remplacent jamais une version locale plus récente. Les chargements distants utilisent une révision pour écarter une réponse périmée.
En cas de panne de lecture cloud, le cache validé reste affiché avec un message français et Réessayer. Un cache corrompu n’est ni masqué ni écrasé. Les erreurs de mutation sont renvoyées au formulaire ; les modifications restent en cache. Il n’existe pas de file de reprise persistante après fermeture de l’app : relancer explicitement Push après une panne, avec les limites ci-dessous.
Push lit seulement le cache (aucune lecture cloud) et valide tout le lot avant la première mutation. Pull lit seulement le cloud, valide toutes les réponses avant la première écriture locale, remplace aussi les collections vides et rétablit les réglages par défaut si la ligne distante est absente. Il n’amorce jamais un compte vide en envoyant le cache.
Push est un envoi des éléments présents, pas un remplacement global du serveur : il n’infère pas de suppressions à partir d’une absence. Une suppression en échec réseau doit être retentée explicitement avant Pull ; seul un DELETE réussi confirme sa propagation. Une fermeture pendant une commande réseau ne garantit pas sa reprise automatique. Les tables cloud ne sont pas écrites atomiquement entre elles : les lots sont validés intégralement avant envoi, mais une panne réseau peut interrompre un push après une première table.
Les quatre états d’interface existants restent utilisés : chargement, vide, données et erreur ; une erreur cloud de lecture accompagne les données du cache sans les masquer. Aucun écran ni token n’a été modifié.

# Types Supabase et authentification

`src/types/database.ts` contient le contrat réellement généré par le MCP Supabase `generate_typescript_types` le 16/10/2026 depuis le projet `skzehjvqvdbxfehbrgzu`, schéma **public** (PostgREST 14.18). Les quinze alias Row/Insert/Update sont dérivés de ce contrat ; aucun champ n’est maintenu à la main. Le fichier temporaire de passation a été intégré puis retiré pour éviter deux copies concurrentes.
Le client unique configure explicitement `db.schema = nova`.
Pour régénérer le contrat, installer/authentifier la CLI Supabase selon sa [documentation officielle](https://supabase.com/docs/guides/api/rest/generating-types), vérifier `supabase gen types --help`, puis lancer :

```sh
node scripts/generate-db-types.mjs --project-id skzehjvqvdbxfehbrgzu --schema nova
npm run typecheck
```

Le script appelle uniquement `supabase gen types typescript` avec un schéma explicite public/nova ; il introspecte la structure, ne lit ni ne reproduit les lignes et n’applique aucune migration. En cas d’échec, le fichier existant est conservé. Les tests du script substituent le runner, sans appel réseau. La commande réelle n’a pas été exécutée pendant L5 (source MCP fournie).
Les erreurs d’inscription/connexion/déconnexion sont traduites en français sans afficher les détails privés du serveur. Le client détecte les callbacks de session dans l’URL sur le web ; le mode local ne crée aucun client Supabase et ne lance pas d’authentification.
