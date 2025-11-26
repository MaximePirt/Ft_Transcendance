friendController = require("../controllers/friendController")

async function friendRoutes(fastify, options)
{
	fastify.delete("/friends/:friendId", async (request, reply) =>
	{
		try {
			const res = await friendController.removeFriendHandler(request, reply);
			if (res) return res;
			else return reply.code(500).send({ ok: false, message: "Unknown error" });
		}
		catch (error) {
			request.log.error(error);
			return reply.code(500).send({ ok: false, message: "Internal Server Error" });
		}
	});

	fastify.post("/friends", async (request, reply) =>
	{	//TODO: This is a temporary fix, need to get userId from auth token
		const { userId, friendId } = request.body;
		if (!userId || !friendId) {
			return reply.code(400).send({ ok: false, message: "userId & friendId is required" });
		}

		return await friendController.addFriendHandler(userId, friendId);
	});
	fastify.patch("/friends", async (request, reply) =>
	{
		return await friendController.addFriendHandler(request, reply);
	});
}


module.exports = friendRoutes;