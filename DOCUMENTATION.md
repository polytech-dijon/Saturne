# Documentation du Projet Saturne

## Aperçu du Projet

Saturne est une application web construite avec **Next.js**, utilisant **Prisma** pour la gestion de la base de données
et **Postgres** comme base de données. Le projet est conteneurisé avec **Docker** pour garantir des environnements de
développement et de production cohérents. Cette documentation fournit des instructions claires pour démarrer et
maintenir le projet efficacement.

---

## Configuration de l'Environnement de Développement

### Prérequis

Avant de commencer, assurez-vous que les outils suivants sont installés :

- **[Docker](https://www.docker.com/)** : Pour exécuter les conteneurs de développement et de production.
- **[Node.js](https://nodejs.org/en)** : Version 20 ou supérieure (requis si vous exécutez localement sans Docker).
- **[npm](https://www.npmjs.com/)** : Livré avec Node.js pour gérer les dépendances.

### Variables d'Environnement

Dans le projet, on utilise deux fichiers pour gérer les variables d'environnement :

- `.env` : Fichier de configuration des variables d'environnement pour la production.
- `.env.local` : Fichier de configuration des variables d'environnement pour le développement.

Le fichier `.env.example` fournit un modèle pour les variables d'environnement requises pour le développement.

> [!IMPORTANT]
> Les fichiers `.env*` contiennent des variables sensibles (comme les identifiants de base de données). Ne les
> versionnez pas (sauf `.env.example`), en particulier `.env`, utilisé pour la production.

1. Copiez le fichier `.env.example` vers `.env.local` :

   ```bash
   cp .env.example .env.local
   ```

2. Remplissez les valeurs requises dans `.env.local` :

- `POSTGRES_USER` : Votre nom d'utilisateur Postgres.
- `POSTGRES_PASSWORD` : Votre mot de passe Postgres.
- `POSTGRES_DB` : Le nom de votre base de données.
- `DATABASE_URL` : Automatiquement défini à
  `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}?schema=public` (ajustez si
  nécessaire).

> [!CAUTION]
> **Problème de connexion à la base de données entre local et Docker**
> L’URL de connexion dans `.env.local` utilise `localhost` pour les migrations ou seeds locaux, mais cela ne fonctionne
> pas dans Docker, car `localhost` désigne le conteneur, pas la machine hôte.
> **Solution** :
> - Dans `.env.local`, gardez le `DATABASE_URL` de `.env.example`.
> - Dans `docker-compose.dev.yaml`, `DATABASE_URL` est automatiquement remplacé avec `postgres` comme hôte (ex.
    `postgresql://user:pass@postgres:5432/db`).
    > Cela assure que l’application fonctionne correctement en local et dans Docker.

---

### Lancement du Conteneur de Développement

Pour démarrer l'environnement de développement avec Docker :

```bash
npm run docker:dev
```

- Cette commande utilise `docker-compose.dev.yaml` pour lancer l'application Next.js et la base de données Postgres.
- Le répertoire local est monté, donc les modifications du code sont reflétées en direct sans redémarrer le conteneur.

> [!NOTE]
> Si vous modifiez les dépendances dans `package.json`, reconstruisez le conteneur avec :
> ```bash
> npm run docker:dev:build
> ```

---

## Gestion de la Base de Données avec Prisma

### Configuration Initiale

La première fois que vous configurez le projet :

1. Assurez-vous que le conteneur de développement est en cours d'exécution (`npm run docker:dev`).
2. Appliquez les migrations initiales de la base de données :

   ```bash
   npm run db:migrate
   ```

- Cela crée le schéma de la base de données basé sur `prisma/schema.prisma`.
- Cela génère également le client Prisma pour une utilisation dans l'application.

### Développement Continu

Chaque fois que vous modifiez `prisma/schema.prisma` (par exemple, en ajoutant un nouveau modèle ou champ) :

1. Exécutez de nouveau la commande de migration :

   ```bash
   npm run db:migrate
   ```

- Cela met à jour le schéma de la base de données et régénère le client Prisma.
- Assurez-vous que le conteneur de développement est en cours d'exécution.

> [!TIP]
> Nommez vos migrations pour les identifier plus facilement :
> ```bash
> npm run db:migrate -- --name "nom-de-la-migration"
> ```

### Peuplement de la Base de Données

Pour remplir la base de données avec des données initiales (définies dans `prisma/seed.ts`) :

```bash
npm run db:seed
```

- Exécutez ceci :
  - Après la configuration initiale pour charger des données d'exemple.
  - À chaque fois que vous réinitialisez la base de données et souhaitez la repeupler.

---

## Exécution de l'Application

Pour lancer l'application Next.js en mode production, exécutez :

```bash
npm run docker:prod
```

- Construit et exécute les conteneurs de production en utilisant `docker-compose.yaml`.
- Convient pour vérifier la construction de production localement.

> [!CAUTION]
> Si vous lancez l'application en mode production sur votre machine locale, vous risquez d'avoir des problèmes pour
> repasser en mode développement. Supprimez d'abord les conteneurs de production avant de lancer les conteneurs de
> développement :
> ```bash
> docker rm saturne-prod postgres-prod
> docker volume rm saturne_saturne-postgres-data-prod
> docker network rm saturne_saturne-network-prod
> npm run docker:dev:build
> ```
> **Attention** : Si vous avez tenté de lancer le mode développement avant de supprimer les conteneurs de production,
> les noms des conteneurs à supprimer peuvent différer.

---

## Tests et Qualité du Code

### Exécution des Tests

Pour exécuter la suite de tests :

```bash
npm test
```

- Exécute les tests dans `__tests__/` en utilisant Jest.
- Génère des rapports de couverture dans le répertoire `coverage/`.

### Linting

Pour vérifier le style et la qualité du code :

```bash
npm run lint
```

- Utilise ESLint avec la configuration Next.js pour garantir la cohérence.

---

## Outils et Commandes Additionnels

### Prisma Studio

Pour inspecter et gérer la base de données via une interface graphique :

```bash
npm run db:studio
```

- Ouvre Prisma Studio dans votre navigateur.
- Nécessite que le conteneur Postgres soit en cours d'exécution et que `.env.local` soit configuré correctement.

---
