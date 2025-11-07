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

