import Fastify from 'fastify'
import cors from '@fastify/cors'
import bcrypt from 'bcryptjs'

const fastify = Fastify();
await fastify.register(cors, {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
    allowedHeaders: ['Content-type', 'Authorization'],
})

const saltWorkFactor = 12;

fastify.get('/', async function (request, reply) {
    console.log('Hello world !');
})

function User(username, email, password) {
    this.username = username;
    this.email = email;
    this.password = password;
}

fastify.post('/signup', async function (request, reply) {
    console.log('data received !');
    const user = Object.create(User);
    user.username = await request.body.username;
    user.email = await request.body.email;
    user.password = await bcrypt.hash(request.body.password, saltWorkFactor);
    console.log(`username: ${user.username}, email: ${user.email}, password: ${user.password}`);
})

const start = async () => {
  try {
    await fastify.listen({ port: 3003, host: 'localhost' })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
  fastify.log.info(`server listening !`)
}

start()