

module.exports = async function authPlugin(fastify, opts) {
	
	fastify.register(require('@fastify/jwt'), { 
		secret: process.env.JWT_SECRET 
	});


	fastify.register(require("@fastify/cookie"), {
		secret: process.env.JWT_SECRET,
		parseOptions: {},
		maxAge: 60_000,
	});

	fastify.decorate('authenticate', async (request, reply) => {
		try {
			request.user = await request.jwtVerify();
		} catch (err) {
			reply.code(401).send({ error: 'Unauthorized' });
		}
	});

	console.log("Auth plugin registered");
};
