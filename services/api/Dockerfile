FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install

# RUN npm install fastify better-sqlite3

# RUN npm install fastify-jwt

COPY . .

EXPOSE 3000

CMD ["node", "src/app.js"]