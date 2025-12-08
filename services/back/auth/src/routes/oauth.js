'use strict'

import oauthPlugin from '@fastify/oauth2';
import { handleGoogleCallback } from '../controllers/authController.js';

export default async function oauthRoutes(fastify, options) {
  // Enregistrer le plugin OAuth2 pour Google
  await fastify.register(oauthPlugin, {
    name: 'googleOAuth2',
    scope: ['profile', 'email'],
    credentials: {
      client: {
        id: fastify.config.GOOGLE_CLIENT_ID,
        secret: fastify.config.GOOGLE_CLIENT_SECRET
      },
      auth: oauthPlugin.GOOGLE_CONFIGURATION
    },
    callbackUri: fastify.config.GOOGLE_CALLBACK_URL
  });

  // Route manuelle pour /auth/google qui redirige vers Google
  fastify.get('/google', async (request, reply) => {
    const authUrl = await fastify.googleOAuth2.generateAuthorizationUri(request, reply);
    return reply.redirect(authUrl);
  });

  // Route de callback Google
  fastify.get('/google/callback', async (request, reply) => {
    try {
      const { token } = await fastify.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
      await handleGoogleCallback(fastify, token, reply);

    } catch (error) {
      fastify.log.error('OAuth callback error:', error);
      return reply.redirect(
        `${fastify.config.FRONTEND_URL}/login?error=authentication_failed`
      );
    }
  });

  // Route de test
  fastify.get('/status', async () => {
    return {
      status: 'ok',
      service: 'auth',
      google_oauth: 'configured'
    };
  });
}
