const fp = require("fastify-plugin");

module.exports = fp(async function authPlugin(fastify) {
	fastify.decorate("authenticate", async function (request, reply) {
		try {
			await request.jwtVerify();
		} catch (err) {
			return reply.code(401).send({
				status: "Unauthorized",
				error: err.message
			});
		}
	});

	console.log("Auth plugin registered");
});
