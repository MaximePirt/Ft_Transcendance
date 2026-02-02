FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
 && rm -rf /var/lib/apt/lists/*


ENV npm_config_build_from_source=true

COPY package.json .

RUN npm install

COPY . .

RUN mkdir -p /db

EXPOSE 3001

ENTRYPOINT ["/scripts/vault-run.sh", "/secrets/user_api/app.env"]

CMD ["node", "--watch", "src/app.js"]
