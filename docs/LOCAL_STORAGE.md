# Lancer NovaBudget en local

```sh
npm install
npm run web
```

Ouvrir `http://localhost:8081` : le tableau de bord est accessible immédiatement, sans compte ni clés Supabase. Le badge « Stockage local » indique ce mode. Les comptes, dépenses, rentrées, projets historiques, versements mensuels et matelas sont enregistrés dans le navigateur par les repositories AsyncStorage existants. Les anciennes clés `@novabudget_*_v3` restent utilisées ; aucune remise à zéro n'est effectuée.

Le stockage est propre à l'origine (protocole, hôte et port), au navigateur et au profil. Conserver la même adresse et le port 8081 pour retrouver ses données. Les données d'un ancien profil cloud déjà mises en cache restent visibles localement. Elles ne sont pas envoyées vers Supabase en local, même si une ancienne session ou des clés existent.

Pour inspecter ou supprimer ces données : outils de développement du navigateur → Application / Stockage → stockage local de l'origine → clés NovaBudget. Effacer le stockage du site ou utiliser la navigation privée peut les supprimer. Elles ne sont pas écrites dans le dépôt Git. Il n'y a pas de synchronisation multi-appareil en mode local.

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
