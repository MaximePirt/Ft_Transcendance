"use strict";
const fastify = require("fastify")({ logger: true });
fastify.register(require("@fastify/websocket"));
fastify.register(require("@fastify/multipart"));
fastify.register(require("./plugins/auth"));
fastify.register(require("./plugins/cors"));
fastify.register(require("./routes/quizRoute"));
fastify.register(require("./routes/wsRoute"));


const start = async () => {
	try {
		await fastify.listen({ port: 3002, host: "quiz_api" });
		console.log("Quiz server listening on port 3002");
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
};

start();
