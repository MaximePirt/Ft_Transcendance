'use strict'

import axios from 'axios';

/**
 * Récupère les informations utilisateur depuis Google
 */
async function getGoogleUserInfo(accessToken) {
  try {
    const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken.access_token}`
      }
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch Google user info: ${error.message}`);
  }
}

/**
 * Trouve ou crée un utilisateur dans le User Service
 */
async function findOrCreateUser(fastify, googleUser) {
  const userServiceUrl = fastify.config.USER_SERVICE_URL;

  try {
    const searchResponse = await axios.get(`${userServiceUrl}/users`, {
      params: { email: googleUser.email }
    });

    if (searchResponse.data && searchResponse.data.length > 0) {
      fastify.log.info(`User found: ${googleUser.email}`);
      return searchResponse.data[0];
    }

    fastify.log.info(`Creating new user: ${googleUser.email}`);

    const newUser = {
      username: googleUser.name || googleUser.email.split('@')[0],
      email: googleUser.email,
      password: 'OAUTH_GOOGLE',
      avatarUrl: googleUser.picture || null
    };

    const createResponse = await axios.post(`${userServiceUrl}/users`, newUser);
    fastify.log.info(`User created successfully: ${createResponse.data.id}`);

    return createResponse.data;

  } catch (error) {
    fastify.log.error('Error in findOrCreateUser:', error.response?.data || error.message);
    throw new Error(`User service error: ${error.message}`);
  }
}

/**
 * Gère le callback Google OAuth
 */
export async function handleGoogleCallback(fastify, token, reply) {
  try {
    fastify.log.info('Fetching Google user info...');
    const googleUser = await getGoogleUserInfo(token);

    fastify.log.info('Google user info received:', {
      email: googleUser.email,
      name: googleUser.name
    });

    const user = await findOrCreateUser(fastify, googleUser);

    const redirectUrl = new URL(`${fastify.config.FRONTEND_URL}/auth/success`);
    redirectUrl.searchParams.append('userId', user.id);
    redirectUrl.searchParams.append('email', user.email);
    redirectUrl.searchParams.append('username', user.username);

    fastify.log.info(`Redirecting to frontend: ${redirectUrl.toString()}`);

    return reply.redirect(redirectUrl.toString());

  } catch (error) {
    fastify.log.error('Error in handleGoogleCallback:', error);

    return reply.redirect(
      `${fastify.config.FRONTEND_URL}/login?error=${encodeURIComponent(error.message)}`
    );
  }
}
