const fp = require("fastify-plugin");

const USER_URL = process.env.USER_API_URL || false;
if (!USER_URL) {
	console.error("USER_API_URL environment variable is not set.");
	process.exit(1);
}

module.exports = fp(async function authPlugin(fastify) {
	fastify.decorate("authenticate", async (request, reply) => {
		try {
			const token = request.cookies.token;
			if (!token) {
				return reply.code(401).send({ error: "No token" });
			}
			const decoded = fastify.jwt.verify(token);
			
			const res = await fetch(`${USER_URL}/users/${decoded.id}`);
			if (!res.ok) {
				reply.clearCookie("token", {
					path: "/",
					httpOnly: true,
					secure: true,
					sameSite: "lax"
				});
				return reply.code(401).send({ error: "User no longer exists" });
			}

			request.user = decoded;

		} catch (e) {
			return reply.code(401).send({ error: "Invalid token" });
		}
	});
});
