FROM node:18-alpine

RUN apk add && apk update && apk add wget
ENV CI=true
WORKDIR /app

COPY . .
RUN wget -qO- https://get.pnpm.io/install.sh | ENV="$HOME/.shrc" SHELL="$(which sh)" sh -
RUN npm install -g pnpm@latest-10
RUN pnpm install

EXPOSE 3003

ENTRYPOINT ["/scripts/vault-run.sh", "/secrets/auth_api/app.env"]

CMD ["node", "--watch", "src/server.js"]
