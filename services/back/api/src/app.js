
//TODO: Implement environment variables for service URLs
// Example: const usersServiceUrl = process.env.USER_API_URL || 'http://localhost:3001/users';

const fastify = require('fastify')({ logger: true })
fastify.register(require('@fastify/reply-from'))

fastify.get('/users', async (request, reply) => {
  // user microservice URL
  const usersServiceUrl = 'http://user_api:3001/users'
  return reply.from(usersServiceUrl)
})

// Each microservice would have its own route
// fastify.get('/example', async (request, reply) => {
//   return reply.from('http://localhost:3002/example')
// })

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' })
    console.log('API Gateway listening on port 3000')
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start();
