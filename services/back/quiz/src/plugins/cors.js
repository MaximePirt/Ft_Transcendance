
module.exports = async function corsPlugin(fastify, opts) {

	fastify.register(require("@fastify/cors"), {
		origin: ["http://localhost:5173", "http://user_api:3001"],
		methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
		credentials: true,
		allowedHeaders: ["Content-type", "Authorization"],
	});

	console.log("Cors plugin registered");

};