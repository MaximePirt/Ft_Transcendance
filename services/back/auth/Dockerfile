FROM node:18-bullseye-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    python3 \
    python3-dev \
    build-essential \
    pkg-config \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm ci --only=production --build-from-source

COPY . .


ENTRYPOINT ["/scripts/vault-run.sh", "/secrets/auth_api/app.env"]
CMD ["node", "--watch", "src/app.js"]
