"use strict";
const fastify = require("fastify")({ logger: true });
const fastifyJwt = require("@fastify/jwt");
fastify.register(require("@fastify/websocket"));
fastify.register(require("@fastify/multipart"));


const jwt_secret = process.env.JWT_SECRET || false;
if (!jwt_secret) {
	console.error("JWT_SECRET environment variable is not set.");
	process.exit(1);
}

fastify.register(require("@fastify/cookie"), {
	secret: jwt_secret,
	parseOptions: {}
});


fastify.register(fastifyJwt, {
	secret: jwt_secret,
	cookie: {
		cookieName: "token",
		signed: false
	}
});

fastify.register(require("./plugins/auth"));
fastify.register(require("./plugins/cors"));
fastify.register(require("./routes/quizRoute"));
fastify.register(require("./routes/wsRoute"));


const start = async () => {
	try {
		await fastify.listen({ port: 3002, host: "0.0.0.0" });
		console.log("Quiz server listening on port 3002");
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
};

start();
