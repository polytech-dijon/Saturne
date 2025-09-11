# Saturne

Une version améliorée de mercure

## Présentation

### Présentation du produit

Mercure est un service d’affichage lié à la section communication du BDE.
PolyBytes utilise aussi librement ce service pour y faire sa propre communication. Il est composé de 3 parties :

- Client : Sert à l’affichage en mode carrousel des différentes affiches mises en ligne.
- Panneau d’administration : Sert à ajouter, modifier et supprimer les différentes affiches.
- API : Permet aux deux services précédents de fonctionner.
  Mercure affiche aussi des informations relatives aux trams et aux bus du réseau Divia et se connecte à ses apis.

### Objectif

Dans le cadre de la reprise des différents projets, les membres de PolyBytes ont décidé d’améliorer les aspects qualités
et DevOps de leurs différents produits. Plusieurs projets de refontes partiels ou complets seront ainsi entrepris dans
ce sens. Le produit Mercure, servant à l’affichage est sources de plusieurs problématiques :

- Pas de framework : Code réalisé en javascript vanilla
- Pas d’ORM : Les migrations sont pénibles à réaliser
- UI améliorable : Surtout sur la partie “panneau d’administration”
- Pas de test : Comportement instable.
- Sécurité : Plusieurs éléments ont été identifiés comme n’étant pas assez sécurisés et doivent être améliorés.

Ce projet vise à résoudre ces problématiques telles que :

- Utilisation de Next et de React
- Utilisation de Prisma
- Nouvelles maquettes correspondant à la charte graphique de PolyBytes
- Ajout de framework de tests unitaire (Jest) et End2End (Cypress) dans une démarche de Test Driven Development

Le choix des technologies est lié à la volonté de limiter la dette technique en réduisant le nombre de technologies à
maîtriser pour travailler sur les différents produits de PolyBytes. Une partie du projet sera gérée par le tuteur du
club assigné au projet, notamment sur la mise en place d'environnements de développement, de test et de production et
toutes les étapes à automatiser.

Aussi, on passera de trois sous projets à une architecture simplifiée en un projet ou les parties administrations seront
protégées par un mot de passe.

Certaines fonctionnalités ont aussi été identifiées comme bénéfiques à ajouter, tel que :

- Possibilité de planifier une affiche
- Possibilité d’ajouter une date de suppression automatique pour les affichages
- Possibilité de gérer le temps d’affichage d’une affiche
- Limitation des formats de fichiers (taille et type de fichier)
- Système de comptes afin de mieux cloisonner l'application

D’autres fonctionnalités pourraient être proposées par les étudiants ou membres du BDE pendant la période active du
projet.

## Contributeurs

<div align="center">
	<table>
		<tr>
			<td><img width="100" src="https://avatars.githubusercontent.com/u/71908560" alt="Arno BIDET" title="Arno BIDET"/></td>
			<td><img width="100" src="https://avatars.githubusercontent.com/u/122306936" alt="Raphaël Asdrubal" title="Raphaël Asdrubal"/></td>
			<td><img width="100" src="https://avatars.githubusercontent.com/u/131671439" alt="Victor Olivier" title="Victor Olivier"/></td>
		</tr>
        <tr>
			<td style="text-align:center;"><a href="https://github.com/ArnoBidet">Arno Bidet</a></td>
			<td style="text-align:center;"><a href="https://github.com/Horizon-NTH">Raphaël Asdrubal</a></td>
			<td style="text-align:center;"><a href="https://github.com/Victor3699">Victor Olivier</a></td>
		</tr>
	</table>
</div>

## Technologies et prérequis

<table>
  <tr>
    <th style="text-align:center">Langages</th>
  </tr>
  <tr>
    <td>
      <img height="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/html.png" alt="HTML" title="HTML"/>
      <img height="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/css.png" alt="CSS" title="CSS"/>
      <img height="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/typescript.png" alt="TypeScript" title="TypeScript"/>
    </td>
  </tr>
</table>

<table>
  <tr>
    <th style="text-align:center">Frameworks</th>
  </tr>
  <tr>
    <td>
      <img height="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/react.png" alt="React" title="React"/>
      <img height="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/next_js.png" alt="Next.js" title="Next.js"/>
      <img height="50" src="https://cdn.freelogovectors.net/wp-content/uploads/2022/01/prisma_logo-freelogovectors.net_.png" alt="Prisma" title="Prisma"/>
    </td>
  <tr>
</table>

<table>
  <tr>
      <th style="text-align:center">Outils</th>
  </tr>
  <tr>
    <td>
      <img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/github.png" alt="GitHub" title="GitHub"/>
      <img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/figma.png" alt="Figma" title="Figma"/>
      <img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/jest.png" alt="Jest" title="Jest"/>
      <img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/cypress.png" alt="Cypress" title="Cypress"/>
      <img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/docker.png" alt="Docker" title="Docker"/>
    </td>
  <tr>
</table>
