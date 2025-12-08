'use strict'

import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyCookie from '@fastify/cookie';
import fastifyEnv from '@fastify/env';
import oauthRoutes from './routes/oauth.js';

const schema = {
  type: 'object',
  required: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
  properties: {
    GOOGLE_CLIENT_ID: { type: 'string' },
    GOOGLE_CLIENT_SECRET: { type: 'string' },
    GOOGLE_CALLBACK_URL: { type: 'string', default: 'http://localhost:3003/auth/google/callback' },
    FRONTEND_URL: { type: 'string', default: 'http://localhost:5173' },
    USER_SERVICE_URL: { type: 'string', default: 'http://user_api:3001' }
  }
};

async function build(opts = {}) {
  const app = Fastify({ logger: true, ...opts });

  await app.register(fastifyEnv, { schema, dotenv: true });
  await app.register(fastifyCookie);
  await app.register(fastifyCors, {
    origin: app.config.FRONTEND_URL,
    credentials: true
  });

  await app.register(oauthRoutes, { prefix: '/auth' });
  app.get('/', async (request, reply) => {
    return { status: 'Auth service running', version: '1.0.0' };
  });

  return app;
}

const start = async () => {
  try {
    const app = await build();
    await app.listen({ port: 3003, host: '0.0.0.0' });
    console.log('Auth Service running on http://localhost:3003');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();

export default build;