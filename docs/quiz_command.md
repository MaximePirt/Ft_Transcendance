Commandes pour tester le quiz depuis le terminal :

Créer une game :
```sh
curl -X POST http://127.0.0.1:3002/game-sessions \                                    
  -H "Content-Type: application/json" \  -H "Cookie: token=TON_JWT_ICI" \     
  -d '{
    "question_count": 3
  }
```
Lors des curls, je suis obliger de parler directement au port 3002 du quiz, pcq j ai pas de certs SSL sur le terminal et j ai la flemme de me prendre la tête, c'est pour cette raison qu'il y a encore les "ports" sur le docker-compose.yml

Donc on curl un Post pour la game, avec comme option "question_count" : X, ici c'est 3, pour du débug c'est plus simple, mais tu peux ajouter + de questions en mettant 10 par exemple.
Tu peux en plus ajouter des options comme le mod ou autre (voir la route fastify.post('/game-sessions', notamment le schema associé qui détaille la chose)

exemple :
```sh
curl -X POST http://127.0.0.1:3002/game-sessions \         
  -H "Content-Type: application/json" \
  -H "Cookie: token=TON_JWT_ICI" \
  -d '{                                     
    "question_count": 10, "power_ups": ["skip"]
  }'
```

Le terminal te donneras ce retour 
```
{"status":"Game session created","gameSession":"E1B68B"}
```

On utilisera le code de session pour démarrer la partie. Avant cela, tu voudras ptet ajouter un second joueur
On utilise donc cette commande :
```sh
curl http://127.0.0.1:3002/game-sessions/join   -H "Content-Type: application/json" \
  -H "Cookie: token=TON_JWT_ICI" \
  -d '{"code":"E1B68B"}'
```
(on réutilise donc le sessionCode)

>[!info] Pour la phase de débug, les user_id au sein des routes sont fixés a 1 ou 2 car avec curl il est compliqué d'avoir à gérer les différents user. Si tu veux ajouter + d'utilisateur il faut soit passer par user_id (et donc ajouter le code sur le front ou lui renvoyer les bons packets en +), soit faire des routes "bis" (ce que j ai fais avec un joinbis en mode feignant, on y arrive)

Maintenant c'est super, bob a rejoins la partie !

Maintenant, on va check que Alice (actuel host) puisse quitter et revenir dans la partie :
Voici la route
```sh
fastify.delete('/game-sessions/:id/players/me', {preHandler: fastify.authenticate},
```

et voici donc la commande 
```sh
curl -X DELETE http://127.0.0.1:3002/game-sessions/1/players/me 
```

Super, mais la, le terminal ne renvoi rien, on est pas sur que ça ai fonctionner. On va donc vouloir récupérer toutes les informations de la partie.
Voici la route :
```sh
fastify.get('/game-sessions/:id',........
```
Voici la commande :
```sh
curl http://127.0.0.1:3002/game-sessions/1
```

Ce qui nous offre ce retour :
```
{"status":"Game session details","sessionData":{"id":1,"code":"E1B68B","mode":"random","topic":null,"question_count":3,"max_players":4,"host_id":2,"status":"waiting","started_at":"2026-02-24 00:02:42","ended_at":null,"current_question_order":0,"current_question_time":null,"power_ups":null,"players":[{"id":2,"username":"bob","joined_at":"2026-02-24 00:07:51","answered_count":0,"correct_answers":0,"score":0,"is_active":1}]}}%  
```
Ou on y voit que bob comme unique player.

On va maintenant faire revenir Alice, mais comme mes routes ont uniquement un user_id unique pour le débug, on va utiliser joinbis au lieu de join 
```sh
curl http://127.0.0.1:3002/game-sessions/joinbis   -H "Content-Type: application/json" \
  -H "Cookie: token=TON_JWT_ICI" \
  -d '{"code":"E1B68B"}'
{"status":"joined","gameSessionId":1}%
```

Maintenant, on a deux joueurs, on va donc bientot lancer la partie.
>[!error] Ici, ca ne fonctionnera pas ! car lorsque Alice a quitté la partie, elle a perdu le rôle de host et l'a offert a Bob. Deux solutions : Relancer le docker-compose avec -v, refaire les étapes jusqu'au join de bob et lancer la partie, ou modifier l'user_id dans la route de start pour séléctionner celui de bob, et relancer le programme en refaisant toutes les actions précédentes

De mon coté, je vais faire revenir bob, et lancer la partie sans faire sortir Alice afin qu'elle reste host, le code des commandes ne sera donc pas le même maintenant.

Voici la route js pour lancer la game :
```js
fastify.post(`/game-sessions/start`
```

Et voici la commande :
```sh
curl http://127.0.0.1:3002/game-sessions/start   -H "Content-Type: application/json" \  -H "Cookie: token=TON_JWT_ICI" \     
  -d '{"code":"E10D51"}'
```

Ceci lance chaque questions. Chaque question possède un timer de 45 secondes par défaut laissant le temps à chaque joueur de répondre. Si deux joueurs répondent, on passe directement a la question suivante.
Pour le moment, cette variable se trouve dans le secret QUESTION_TIMER, mais je me tattais à en faire un argument lors de la création de la game, après ca vous rajoutais du boulot j'ai préférer ne pas le faire. si tu veux créer des tests a la chaine, tu ferais mieux de réduire le temps de la question, mais attention a garder le temps pour être en capacité de répondre, sinon une réponse fausse sera obligatoirement appliquée à l'utilisateur

Une fois la partie lancée, l'utilisateur va devoir récupérer la question :

```sh
curl http://127.0.0.1:3002/game-sessions/1/current-question  -H "Cookie: token=TON_JWT_ICI"    
```


qui nous renverra :
```

```

Et voici la manière d'y répondre :
```sh
curl -X POST http://127.0.0.1:3002/game-sessions/1/answer \    -H "Content-Type: application/json" \
  -H "Cookie: token=JWT" \
  -d '{"question_id": 21, "answer" : 1}'
```

qui nous enverra :
```
{"status":"Answer submitted","result":{"is_correct":true,"current_score":100,"correct_answers":{"type":"mcq","answer":2},"total_correct":1,"total_answered":1}}% 
```

ou 
```
{"status":"Answer submitted","result":{"is_correct":false,"current_score":100,"correct_answers":{"type":"mcq","answer":1},"total_correct":10,"total_answered":1}}%  
```

A la fin des questions, la partie passe automatiquement en "completed", et ajoute is_winner =1 au vainqueur.

----
Lors de ce tutoriel, je n'ai pas parler des websockets, et donc de la manière de jouer des powers-up, qui sont attribués selon un certains taux aux joueurs après qu'ils aient répondus à une question.

Lors de l'ouverture de la game, le client devra se connecter en websoquet. Pour le débug j'utilise l'outil websocat avec cette commande :
```sh
websocat  ws://127.0.0.1:3002/ws/game-sessions/1
```
qui me renvoi 
```
{"type":"session_state","payload":{"sessionId":1,"game_status":"completed"}}
```
Ici le status est completed car la game est fini, mais lorsque la game est en cours, cela affiche les différents updates, nouvelles questions, etc.

Pour jouer un power-up, il faudra faire ceci :
```
{"type":"powerup_use","payload":{"powerupId":1}}
```
l'id du powerup dépendra de la game, mais ducoup c'est entre 1 et 3

---
Enfin, la partie est fini, on va vouloir regarder les stats des joueurs :
```sh
curl  http://localhost:3001/1/stats 
```

qui nous renvoi les stats de Alice (id = 1)
```
{"result":{"total_matches":1,"wins":0,"total_score":100,"answered":3,"correct":1,"win_rate":0,"accuracy":33.33}}%           
```

et le résultat pour bob par exemple (2)
```
{"result":{"total_matches":1,"wins":0,"total_score":0,"answered":3,"correct":0,"win_rate":0,"accuracy":0}}%                 
```
si on prend charlie (3) qui n'a jamais joué :
```
{"result":{"total_matches":0,"wins":0,"total_score":0,"answered":0,"correct":0,"win_rate":0,"accuracy":0}}%                 
```
