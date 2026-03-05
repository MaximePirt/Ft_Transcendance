const fp = require("fastify-plugin");

module.exports = fp(async function authPlugin(fastify) {
	fastify.decorate("authenticate", async function (request, reply) {
		try {
			console.log("headers.cookie =", request.headers.cookie);
			console.log("request.cookies =", request.cookies);

			await request.jwtVerify();

			console.log("request.user after jwtVerify =", request.user);
		} catch (err) {
			return reply.code(401).send({
				status: "Unauthorized",
				error: err.message
			});
		}
	});

	console.log("Auth plugin registered");
});
