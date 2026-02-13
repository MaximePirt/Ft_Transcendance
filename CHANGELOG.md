Fix user problem in front which couldn't find user data to export it in json

docker-compose.yml - remove front useless volumes + add secrets
front Dockerfile - add .env from vault
Remove useless files as nginx/data and vault/files ...
put back api inside nginx.conf


auth_api :
Route:

give fastify variable to JWTGenerator
add User type
in signin :
get id from user_api with fetch
in model :
comment bcrypt compare, only with dev purpose
 - at the time, signin/signup doesn't work so we input passwork directly to the database which isn't hashed
with that we can make signin work and get the cookie


front :
DataRequester
-const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'
+const API_BASE = import.meta.env.VITE_API_URL || 'https://localhost'
modify every fetch to add the right endpoints (/user/ for example) -> See discord conversation from 02/09/2026 12:45
add a forced signup to simulate a connexion (dev purpose)

AuthContext.tsx:
Same for API variable + fetch
