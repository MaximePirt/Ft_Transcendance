FROM node:22.12-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

EXPOSE 5173

ENTRYPOINT ["/scripts/vault-run.sh", "/secrets/front/app.env"]


CMD ["npm", "run", "dev"]
