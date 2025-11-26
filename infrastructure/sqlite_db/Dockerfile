FROM node:20-slim

WORKDIR /app
COPY package*.json ./
RUN npm install better-sqlite3
COPY init_db.js ./

RUN mkdir -p /db

CMD ["node", "init_db.js"]
