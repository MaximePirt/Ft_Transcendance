FROM node:20-slim

WORKDIR /db
COPY package*.json ./
RUN npm install better-sqlite3
COPY init_db.js ./

# À la construction, lance le script pour créer la DB
RUN node init_db.js

