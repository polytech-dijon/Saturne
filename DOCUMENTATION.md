# Saturne — Documentation technique

Application web **Next.js** avec **Prisma** (ORM) et **PostgreSQL**, conteneurisée via **Docker**. Ce document explique
pas à pas comment installer, développer, tester et déployer le projet. Il vise à être utile même à quelqu’un qui ne
connaît pas encore bien Prisma, Docker ou Next.js.

---

## Sommaire

* [Démarrage rapide](#démarrage-rapide)
* [Prérequis](#prérequis)
* [Variables d’environnement](#variables-denvironnement)
* [Développement (Docker)](#développement-docker)
* [Exécutions de commandes](#exécutions-de-commandes)
* [Base de données (Prisma)](#base-de-données-prisma)
* [Jeu de données de test (seed)](#jeu-de-données-de-test-seed)
* [Exécution en production](#exécution-en-production)
* [Tests (unitaires & E2E)](#tests-unitaires--e2e)
* [Qualité du code](#qualité-du-code)
* [Référence des scripts npm](#référence-des-scripts-npm)
* [Sécurité & bonnes pratiques](#sécurité--bonnes-pratiques)
* [Problèmes fréquents (FAQ)](#problèmes-fréquents-faq)

---

## Démarrage rapide

1. Copiez l’exemple de configuration d’environnement :

   ```bash
   cp .env.example .env.local
   ```
2. Modifiez `.env.local` et renseignez les variables nécessaires (voir tableau ci-dessous).
3. Lancez l’environnement de développement avec Docker :

   ```bash
   npm run docker:dev
   ```

   Ce script démarre l’application Next.js et une instance PostgreSQL dans des conteneurs Docker, configure les volumes
   et active le rechargement automatique du code.
4. Appliquez les migrations de la base de données avec Prisma :

   ```bash
   npm run db:migrate
   ```
5. (Optionnel) Injectez des données de test (seed) :

   ```bash
   npm run db:seed
   ```
6. Ouvrez l’application sur [http://localhost:3000](http://localhost:3000).

---

## Prérequis

* **Docker** pour exécuter l’application et la base en conteneurs.
* **Node.js ≥ 20** (uniquement si vous voulez exécuter l’application directement sans Docker).
* **npm** (fourni avec Node.js) pour gérer les dépendances et scripts.

---

## Variables d’environnement

Utilisez `.env.local` pour le développement et `.env` pour la production. **Ne versionnez jamais** ces fichiers (sauf
`.env.example`).

> [!IMPORTANT]
> Dans l’environnement Docker, l’application accède à PostgreSQL via l’hôte `postgres` (et non `localhost`). Depuis
> votre machine hôte, si le port est exposé, vous pouvez continuer d’utiliser `localhost:5432`.

| Clé                    | Obligatoire |  Contexte   | Exemple / Valeur                                                                                                  | Explication                                                                                                                                                                                                                              |
|------------------------|:-----------:|:-----------:|-------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `POSTGRES_USER`        |      ✓      |  dev+prod   | `postgres`                                                                                                        | Nom d’utilisateur PostgreSQL.                                                                                                                                                                                                            |
| `POSTGRES_PASSWORD`    |      ✓      |  dev+prod   | `postgres`                                                                                                        | Mot de passe PostgreSQL.                                                                                                                                                                                                                 |
| `POSTGRES_DB`          |      ✓      |  dev+prod   | `saturne`                                                                                                         | Nom de la base de données.                                                                                                                                                                                                               |
| `POSTGRES_IP`          |      ✓      |     dev     | `postgres`                                                                                                        | Toujours `postgres` dans Docker. Utilisez `localhost` uniquement pour accéder à la base depuis l'hôte (déconseillé car risque d'incompatibilité avec les scripts, préférez utiliser la [méthode recommandée](#exécutions-de-commandes)). |
| `POSTGRES_PORT`        |      ✓      |  dev+prod   | `5432`                                                                                                            | Port PostgreSQL.                                                                                                                                                                                                                         |
| `DATABASE_URL`         |      ✓      |  dev+prod   | `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_IP}:${POSTGRES_PORT}/${POSTGRES_DB}?schema=public` | Chaîne de connexion utilisée par Prisma.                                                                                                                                                                                                 |
| `AUTH_SECRET`          |      ✓      | dev+CI+prod | (généré)                                                                                                          | Clé utilisée par Auth.js/NextAuth pour sécuriser les sessions et cookies. Générez-la avec : `npx auth secret`.                                                                                                                           |
| `ADMIN_USERNAME`       |      ✓      |    prod     | `admin`                                                                                                           | Identifiant du compte administrateur créé au premier lancement en prod.                                                                                                                                                                  |
| `ADMIN_PASSWORD`       |      ✓      |    prod     | `change-me`                                                                                                       | Mot de passe du compte administrateur initial.                                                                                                                                                                                           |
| `TEST_ADMIN_USERNAME`  |      —      |     dev     | `admin`                                                                                                           | Identifiant de test utilisé par le script de seed.                                                                                                                                                                                       |
| `TEST_ADMIN_PASSWORD`  |      —      |     dev     | `password123`                                                                                                     | Mot de passe de test pour l’admin.                                                                                                                                                                                                       |
| `TEST_EDITOR_USERNAME` |      —      |     dev     | `editor`                                                                                                          | Identifiant de test pour un rôle éditeur.                                                                                                                                                                                                |
| `TEST_EDITOR_PASSWORD` |      —      |     dev     | `password123`                                                                                                     | Mot de passe de test pour l’éditeur.                                                                                                                                                                                                     |

> [!NOTE]
> Le fichier `.env.example` contient la liste complète des variables attendues. Ajoutez-y toujours une valeur factice
> quand vous introduisez une nouvelle variable.

---

## Développement (Docker)

Pour démarrer l’environnement de développement :

```bash
npm run docker:dev
```

* Le code source est monté dans le conteneur, donc les modifications sont prises en compte automatiquement.
* Si vous ajoutez de nouvelles dépendances, vous devrez reconstruire les images Docker :

  ```bash
  npm run docker:dev:build
  ```

---

## Exécutions de commandes

Certaines commandes doivent être exécutées **depuis le conteneur** plutôt que depuis votre machine. C’est le cas des
commandes Prisma comme `npx prisma migrate dev`, qui ont besoin d’accéder à la base de données en utilisant la variable
`DATABASE_URL`. Dans Docker, l’hôte de la base est `postgres` et non `localhost`.

Pour éviter de devoir modifier manuellement vos variables d’environnement, exécutez directement les commandes depuis le
conteneur :

```bash
docker exec -it saturne-dev sh -lc "npx prisma migrate dev"
docker exec -it saturne-dev sh -lc "npx prisma studio"
```

C’est pour cette raison que plusieurs scripts npm fournis utilisent déjà cette technique.

---

## Base de données (Prisma)

Prisma est l’ORM du projet : il décrit le **schéma** de la base, génère un **client TypeScript** typé et applique des *
*migrations** versionnées pour faire évoluer la structure des tables en toute sécurité.

Appliquer les migrations :

```bash
npm run db:migrate
```

Modifier le schéma :

1. Éditez `prisma/schema.prisma`.
2. Créez une migration avec la commande ci-dessus.

**Prisma Studio** :

Prisma Studio est l’interface web officielle de Prisma pour **parcourir et modifier** les données de vos tables en
local. C’est pratique pour vérifier l’état de la base après une migration ou ajuster des jeux de test.

```bash
npm run db:studio
```

---

## Jeu de données de test (seed)

Renseignez au préalable les variables `TEST_*` dans `.env.local`, puis exécutez le **seed**, qui insère un jeu minimal
de comptes et de données de démonstration :

```bash
npm run db:seed
```

Cela facilite le développement en vous évitant de créer manuellement des comptes à chaque réinitialisation de la base.

---

## Exécution en production

1. Définissez `AUTH_SECRET`, `ADMIN_USERNAME` et `ADMIN_PASSWORD` (ainsi que toute autre variable applicative requise).
2. Démarrez l’application en mode production :

   ```bash
   npm run docker:prod
   ```

> [!CAUTION]
> Si vous passez du mode **prod** au mode **dev**, veillez à stopper et supprimer les conteneurs/volumes de production
> avant de relancer le développement :
>
> ```bash
> docker compose -f docker-compose.yaml down -v --remove-orphans
> npm run docker:dev:build
> ```

---

## Tests (unitaires & E2E)

**Tests unitaires (Jest)** :

```bash
npm test
```

* Les fichiers de test sont placés sous `__tests__/`.
* Un rapport de couverture est généré dans `coverage/`.
* Jest exécute les tests unitaires de logique (fonctions, services, composants isolés) **sans lancer de navigateur**.

**Tests end-to-end (Cypress)** :

* En CI (mode headless) :

  ```bash
  npm run e2e:ci
  ```
* En local (mode interactif avec l’UI) :

  ```bash
  npm run docker:dev
  npm run e2e:local
  ```

  Cypress pilote un navigateur pour valider des **parcours utilisateur de bout en bout** (authentification, navigation,
  formulaires, etc.).

---

## Qualité du code

Exécuter l’analyse du code :

```bash
npm run lint
```

ESLint (preset Next.js) détecte les erreurs courantes et impose un style cohérent. Exécutez-le avant chaque commit pour
éviter les surprises en CI.

---

## Référence des scripts npm

| Script             | Description                                                                              |
|--------------------|------------------------------------------------------------------------------------------|
| `docker:dev`       | Démarre l’application et PostgreSQL en mode développement via `docker-compose.dev.yaml`. |
| `docker:dev:build` | Reconstruit les conteneurs de développement.                                             |
| `docker:prod`      | Construit et lance l’environnement de production via `docker-compose.yaml`.              |
| `db:migrate`       | Applique les migrations Prisma et régénère le client.                                    |
| `db:seed`          | Insère des données de test dans la base.                                                 |
| `db:studio`        | Ouvre Prisma Studio, l’interface web de gestion des données.                             |
| `test`             | Exécute les tests unitaires avec Jest.                                                   |
| `e2e:ci`           | Lance Cypress en mode headless (CI).                                                     |
| `e2e:local`        | Ouvre l’interface graphique de Cypress (nécessite l’app en dev).                         |
| `lint`             | Vérifie la qualité du code avec ESLint.                                                  |

---

## Sécurité & bonnes pratiques

* Ne committez jamais les fichiers `.env*` (sauf `.env.example`).
* Changez les secrets par défaut (`AUTH_SECRET`, mots de passe initiaux, etc.).
* Sauvegardez vos volumes de base de données avant toute mise à jour majeure.

---

## Problèmes fréquents (FAQ)

**Impossible de se connecter à la base en dev**

* Si le problème vient de l'application, vérifiez que la variable d'environnement `DATABASE_URL` utilise l'hôte
  `postgres`.
* Si vous obtenez cette erreur en exécutant une commande, essayez de l'exécuter depuis le conteneur (voir
  la [méthode recommandée](#exécutions-de-commandes))

**Erreur Prisma : *relation "public.User" does not exist***

* Exécutez `npm run db:migrate` pour appliquer les migrations.

**Cypress retourne 404 sur `/login`**

* Vérifiez que l’app tourne bien en dev et que la configuration `baseUrl` de Cypress est correcte.

**Comment générer `AUTH_SECRET` ?**

* Utilisez `npx auth secret`. Ne versionnez jamais ce secret.

---
