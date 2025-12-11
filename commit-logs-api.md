Here will be find every modification from previous version
This file will only remain in api branch, it's not supposed to be present inside dev branch or main branch and if so, must be deleted

Starting version : COMMIT NUMBER 12

Minor modification :
	- init_db.js -> modify id_user and friend by friend_id and user_id


Major modification :
	- Creation of Friends Table :
			- Create links with user tables from FOREIGN keyword + 
				delete if user is deleted
			- Take choice to sort every friends table to avoid unnecessary duplication (1,2 | 2,1)
				It make searching a lil bit more complex but save storage in bigger project (if a lot of users subscribed)
	- Creation of friend files : Controller, Model, Route


Name of previous commit - commit afcc25a974cac277bb672968384abda1c7862b42

Commit Number 13 :

Minor modification :
	- clean some comments in code
	- Remove code in auth.js because it was from AI only to understand how it was supposed to work, not supposed to be push at all
	- Databases :
		- activate Foreign_key inside user/%/db.js


Major modification :
	- database : add initiator in Friends db, which is user who send first invitation
	- friendModel : 
		- Add addFriend functions with 3 sql commands



NEED TO ACTIVATE PARGMA FOREIGN KEY = on 


Name of previous commit - commit 4aa339ab7fe3e185ce98b76dc67137aac07a0590
Commit Number 14 :

Minor modification :
	- rename initiator sql command by statusFriend

Major modification :
	- Add removeFriend function
	- Test docker-compose : Change databases into a persistant volumes. Each docker now need to RUN mkdir -p /db before expose to access volumes
	- Databases totally working on a volume now, add fakes datas during db creation
	- Can add friends (tested with curl command)

Name of previous commit - commit cd96ef1e555494b933ae6a0897844f2ba015ee42

Commit Number 15:

Minor modification :
	- modification inside removeFriend routes - userId is now in header
	- add sqlite3 inside user_api dockerfile, it needs to be removed later because it's only for debug purpose
	- 

Major modification:
	- Remove friends tested and working (with curl)
	- listFriends tested and working (with curl)

Name of previous commit - commit ccb7424bb2c6bbc437842d5aa45cb6317d587044

Commit Number 16

Minor modification:
	- add debug entry into game and game_players databases

Major modification:
	- Create tables : game and game_players which linked to user
	- 
Notes :
	This Commit will probably not be very helpfull because i just remembered the Blockchain module.

Name of previous commit - 2ed0e0933918f22438dd21e3f4c046cb7a0d60f4

Commit Number 17 -

Minor Modification:
	- Databases : add lastConnexion into user database

Major Modification:
	- UserModel.js -> UpdateUserbyId is now using a try-catch to check about already taken datas (username/mail)
	- user -> add job folder which will contain code to anonymize and/or delete inactive users
	



MERGE with front branch : 2b65b3bee0405e83aa4a52d4b57d1da8160fa1ee


Commit number 1 :

Minor modification:
	- fix init_db.js by adding ','
	-
Major modification:
	- add packages @fastify/schedule and toad-scheduler
	- add a purge script in user/src/jobs
	- add a cron logic in user/app.js to use purge function

Name of previous commit - a19940d2edd4fb643971a44b4dc6ba6fb0c35566

Minor modification:
	- Remove wrong folders "user" at root

Major modification:
	- (front) - add gpdr folder for ts files + gpdr css and route
	- (front) - add gpdr compliances on website
	