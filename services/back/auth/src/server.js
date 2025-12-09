import Fastify from 'fastify'
import cors from '@fastify/cors'
import bcrypt from 'bcryptjs'
import jwt from '@fastify/jwt'
import cookie from '@fastify/cookie'

const fastify = Fastify();
await fastify.register(cors, {
	origin: [
		'http://localhost:5173',
		'http://localhost:3001'
	],
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
	credentials: true,
	allowedHeaders: ['Content-type', 'Authorization'],
})
await fastify.register(jwt, {
	//put secret in .env
	secret: 'a-string-secret-at-least-256-bits-long'
})
await fastify.register(cookie, {
	secret: 'a-string-secret-at-least-256-bits-long',
	parseOptions: {},
	maxAge: 60_000
})

const saltWorkFactor = 12;

fastify.get('/', async function (request, reply) {
	console.log('Hello world !');
})

function User(username, email, password, token) {
	this.username = username;
	this.email = email;
	this.password = password;
	this.token = token;
	this.id = 0;
}

function Payload(id, username) {
	this.username = username;
}

function JWTgenerator(user) {
	const payload = Object.create(Payload);
	payload.username = user.username;
	payload.id = user.id;
	const token = fastify.jwt.sign({ payload })
	console.log(`token: ${token}`);
	return token;
}

fastify.post('/signin', async function (request, reply) {
	try {
		const response = await fetch('http://localhost:3001/signin', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(request.body)
		});
		console.log("request: ", JSON.stringify(request.body))
		if (response.ok)
			console.log('data sent to user module !');
		else {
			const errmsg = await response.json();
			console.log(response);
			console.log("error status: ", response.status);
			console.log("error message: ", errmsg);
			return reply.code(404).send(errmsg);
		}
	} catch (e) {
		console.error(e);
	}
})

let id = 0;
fastify.post('/signup', async function (request, reply) {
	console.log('data received !');
	const user = Object.create(User);
	user.username = await request.body.username;
	user.email = await request.body.email;
	user.password = await bcrypt.hash(request.body.password, saltWorkFactor);
	user.id = id++;
	user.token = JWTgenerator(user);
	console.log(`username: ${user.username}, email: ${user.email}, password: ${user.password}`);
	try {
		reply.setCookie('token', user.token, {
			signed: true,
			httpOnly: true
		})
		await fetch('http://localhost:3001/signup', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				username: user.username,
				email: user.email,
				password: user.password
			})
		});
		console.log('token stock in cookies !')
	} catch (error) {
		console.error(error);
	}
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
