# Saturne

Une version améliorée de mercure

## Présentation

### Présentation du produit

Mercure est un service d’affichage lié à la section communication du BDE. PolyBytes utilise aussi librement ce service pour y faire sa propre communication. Il est composé de 3 parties :
- Client : Sert à l’affichage en mode carrousel des différentes affiches mises en ligne.
- Panneau d’administration : Sert à ajouter, modifier et supprimer les différentes affiches.
- API : Permet aux deux services précédents de fonctionner.
Mercure affiche aussi des informations relatives aux trams et aux bus du réseau Divia et se connecte à ses apis.

### Objectif

Dans le cadre de la reprise des différents projets, les membres de PolyBytes ont décidé d’améliorer les aspects qualités et DevOps de leurs différents produits. Plusieurs projets de refontes partiels ou complets seront ainsi entrepris dans ce sens. Le produit Mercure, servant à l’affichage est sources de plusieurs problématiques :
- Pas de framework : Code réalisé en javascript vanilla
- Pas d’ORM : Les migrations sont pénibles à réaliser
- UI améliorable : Surtout sur la partie “panneau d’administration”
- Pas de test : Comportement instable.
- Sécurité : Plusieurs éléments ont été identifiés comme n’étant pas assez sécurisés et doivent être améliorés.
Ce projet vise à résoudre ces problématiques tel que :
- Utilisation de Next et de React
- Utilisation de Prisma
- Nouvelles maquettes correspondant à la charte graphique de PolyBytes
- Ajout de framework de tests unitaire (jest) et End2End (Cypress) dans une démarche de Test Driven Development

Le choix des technologies est lié à la volonté de limiter la dette technique en réduisant le nombre de technologies à maîtriser pour travailler sur les différents produits de PolyBytes. Une partie du projet sera gérée par le tuteur du club assigné au projet, notamment sur la mise en place d'environnements de développement de développements, test et production et toutes les étapes à automatiser.

Aussi, on passera de 3 sous projets à une architecture simplifiée en 1 projet ou les parties administrations seront protégées par un mot de passe.

Certaines fonctionnalitées ont aussi identifiées comme bénéfiques à ajouter, tel que :
- Possibilité de planifier une affiche
- Possibilité d’ajouter une date de suppression automatique pour les affichages
- Possibilité de gérer le temps d’affichage d’une affiche
- Limitation des formats de fichiers (taille et type de fichier)
- Système de comptes afin de mieux cloisonner l'application
D’autres fonctionnalités pourraient êtres proposées par les étudiants ou membres du BDE pendant la période active du projet.

### Technologies et prérequis

- Langages : Typescript, HTML, CSS
- Framework : Next, React
- Outils : Docker, Jest, Cypress, Git(Hub)
