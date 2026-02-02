"use strict";
const fastify = require("fastify")({ logger: true });
fastify.register(require("@fastify/multipart"));
// fastify.register(require("./routes/quizRoute"));



fastify.register(require("@fastify/cors"), {
	origin: ["http://localhost:5173", "http://user_api:3001"],
	methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
	credentials: true,
	allowedHeaders: ["Content-type", "Authorization"],
});



//TODO: URGENT : MODIFY SECRET AND PUT IT IN ENV
fastify.register(require("@fastify/jwt"), {
	secret: "a-string-secret-at-least-256-bits-long",
});
fastify.register(require("@fastify/cookie"), {
	secret: "a-string-secret-at-least-256-bits-long",
	parseOptions: {},
	maxAge: 60_000,
});




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
