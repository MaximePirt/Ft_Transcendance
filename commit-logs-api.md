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