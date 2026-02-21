"use strict";
// const fastify = require("fastify")({ logger: true });
import Fastify from "fastify"
import multipart from "@fastify/multipart"
import authRoute from './routes/authRoute.js';

const fastify = Fastify();
fastify.register(multipart);
fastify.register(authRoute);

const jwt_secret = process.env.JWT_SECRET || false;
if (!jwt_secret) {
	console.error("JWT_SECRET environment variable is not set.");
	process.exit(1);
}

const cookie_secret = process.env.COOKIE_SECRET || false;
if (!cookie_secret) {
	console.error("COOKIE_SECRET environment variable is not set.");
	process.exit(1);
}

fastify.register(require("@fastify/cors"), {
	origin: [
		'http://localhost/',
		'http://user_api:3001',

	],
	cookie: {
		cookieName: 'token',
		signed: false
	},
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
	credentials: true,
	allowedHeaders: ['Content-type', 'Authorization'],
})

fastify.register(require("@fastify/jwt"), {
	secret: jwt_secret,
});
fastify.register(require("@fastify/cookie"), {
	secret: cookie_secret,
	parseOptions: {},
	maxAge: '24h',
});


const ejs = require("ejs");

fastify.register(require("@fastify/view"), {
	engine: { ejs },
	root: '/app/src/template',
});


const start = async () => {

	try {
		await fastify.listen({ port: 3003, host: "auth_api" });
		console.log("Auth server listening on port 3003");
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
};

start();
