_This project has been created as part of the 42 curriculum by vgodart, tpipi, tdausque and mpierrot_

### Quiz Sprint
**Quiz Sprint** is a competitive web-based quiz application designed to challenge your knowledge — solo or against friends. 
The goal of the project is to deliver an engaging and social quiz experience through a clean interface and real-time multiplayer gameplay.
Players can browse a variety of question categories and answer in two formats: multiple choice (MCQ) or free text input. 
The platform also includes a social layer, allowing users to search for other players, add them as friends, and visit their public profile pages.

In summary, you will find in this project :
	• Solo & multiplayer modes — play alone or challenge friends in real time
	• Multiple categories — a diverse selection of topics to test your knowledge
	• Question formats — MCQ and free-text answer types
	• User profiles — public pages displaying player stats and recent match history
	• Friends system — search, add, and follow other players

### Instructions 

##### Prerequisites

Make sure the following tools are installed on your machine before running the project:

| Tools | Version | Download|
|:-|:-:|:-|
| Docker| >= 24.x | docker.com |
| Docker-compose  | >= 2.x | Included with Docker Desktop |

##### Installation

1. Clone the repository
```sh
git clone git@github.com:Rockmard/ft_trans.git
cd ft_trans
```
/!\ repository adress may change due to school reglementation

Environment Setup
**This project use a secrets folder instead of a .env files.
To make things easier, a secrets-example folder is already provided  with the project**
2. Rename secrets-exemple to secrets
```sh
mv secrets-exemple secrets
```

3. Launch with docker-compose command
```sh
docker-compose up --build
```

The website will be available at https://localhost

> If some dockers error appears, don't hesitate to use docker system prune to clean your computer from similar dockers networks and else

### Resources

###### Documentation
- [Fastify](https://fastify.dev/docs/latest/) — Node.js web framework used for the backend API
- [React](https://react.dev/) — Frontend library
- [Docker Docs](https://docs.docker.com/) — Containerization and Docker Compose setup
- [ws — WebSocket library](https://github.com/websockets/ws) — Real-time multiplayer communication
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) — SQLite database driver
- [JWT (jsonwebtoken)](https://github.com/auth0/node-jsonwebtoken) — Authentication token management
- [HashiCorp Vault](https://github.com/hashicorp/vault-guides/tree/master) - Vault github guide


###### Articles & Tutorials
- [WebSockets in Node.js — A practical guide](https://ably.com/blog/web-app-websockets-nodejs)
- [Docker best practices for Node.js](https://snyk.io/blog/10-best-practices-to-containerize-nodejs-web-applications-with-docker/)
- [Ambar Hassani Medium](https://ambar-thecloudgarage.medium.com/hashicorp-vault-with-docker-compose-0ea2ce1ca5ab) - Vault applied to docker-compose

###### AI Usage
AI tools used during this project were only consulted as a technical assistant and learning purpose throughout the development process.

This has helped clarify API design conventions, understand new key concepts such as database usage, and facilitate learning the syntax of new languages such as JavaScript and SQL.

> All suggestions were reviewed, tested, understood, and adapted manually.  
> No code was copy-pasted from prompt




### Team Information
	◦ Assigned role(s): PO, PM, Tech Lead, Developers, etc.
	◦ Brief description of their responsibilities.
##### Product Owner (PO)
	tpipi

##### Product Manager (PM)
	vgodart

##### Technical Lead
	mpierrot

##### Developers
	tpipi
	vgodart
	tdausque
	mpierrot

#### Project Management:
Work was distributed by module, with each member taking ownership of a specific part of the project based on each personnal preferences, and working on their own dedicated Git branch.

Weekly sync meetings (1 to 2 per week) were held via **Discord voice calls**
to share progress, merge branches when needed, assign upcoming tasks,
and set the next internal deadlines.
We used discord as our main communication platform, organized into dedicated
channels per module and type of work (backend, frontend, database, general, etc.)
We also used Github Project as Kanban board for visual tracking of the project's
progress, using issues as task tracking, linked directly to the Kanban board.


#### Technical Stack:
	◦ Frontend technologies and frameworks used.
	◦ Backend technologies and frameworks used.
	◦ Database system and why it was chosen.
	◦ Any other significant technologies or libraries.
	◦ Justification for major technical choices.

#### Database Schema:
	◦ Visual representation or description of the database structure.
	◦ Tables/collections and their relationships.
	◦ Key fields and data types.


#### Features List:
	◦ Complete list of implemented features.
	◦ Which team member(s) worked on each feature.
	◦ Brief description of each feature’s functionality.
Création et gestion de sessions (code, mode, topic, nombre de questions, max players, game-status).
•	Participation live : rejoindre/quitter, gestion d’actifs/inactifs, transfert d’hôte si nécessaire.
•	Gameplay temps réel : démarrage de partie, lancement de question, calcul du temps restant, et passage à la question suivante.
•	Scoring : enregistrement des réponses, validation “correct/incorrect”, mise à jour des scores et leaderboard.
•	Contenu & personnalisation : génération d’un pool de questions (filtre difficulté / topics quand fournis, sélection aléatoire).
•	Multilingue : questions/options/catégories semblent servis via des tables de traductions (ex.  questiontranslations ,  mcqoptiontranslations ,  categorytranslations ).
•	Power-ups : attribution/consommation de power-ups côté session et joueur, avec notifications live.


### Modules

##### Major modules (2 points each) : 14 points
	- Implement a complete web-based game where users can play against each other : 2 points
	- Framework frontend and backend (react, fastify) : 2 points
	- Implement WAF/ModSecurity + Hashicorp Vault : 2 points
	- Standard user management and authentication : 2 points
	- Backend as microservices : 2 points
	- Multiplayer game : 2 points
	- Websocket : 2 points

##### Minor modules (1 point each) : 9 points
	- GDPR compliance features (mail + delete)  : 1 point
	- Game Statistics and match history : 1 point
	- Module of choice (minor version) : 1 point
	- Support for additional browsers : 1 point
	- Game customization options  : 1 point
	- Complete 2Fa system  : 1 point
	- Multiple language : 1 point
	- Right-to-Left : 1 point
	- Design system : 1 point


#### Total : 23 points


####  Individual Contributions:
	◦ Detailed breakdown of what each team member contributed.
	◦ Specific features, modules, or components implemented by each person.
	◦ Any challenges faced and how they were overcome.
