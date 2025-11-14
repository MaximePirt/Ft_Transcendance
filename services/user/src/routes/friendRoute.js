friendController = require("../controllers/friendController")

async function friendRoutes(fastify, options)
{
	fastify.delete("/users/:userId/friends/:friendId", async (request, reply) =>
	{

		try {
			const { userId, friendId } = request.params;

			const userIdnum = Number(userId);
			const friendIdnum = Number(friendId);

			if (isNaN(userIdnum) || isNaN(friendIdnum)) {
				return reply.code(400).send({ ok: false, message: "Invalid userId or friendId" });
			}
			const res = await friendController.removeFriendHandler(userIdnum, friendIdnum);
        	return reply.code(res.statusCode).send(res);
		}
		catch (error) {
			request.log.error(error);
			return reply.code(500).send({ ok: false, message: "Internal Server Error" });
		}
	});

	fastify.post("/users/:userId/friends", async (request, reply) =>
	{	//TODO: This is a temporary fix, need to get userId from auth token
		const { userId } = request.params;
		const { friendId } = request.body;
		if (!userId || !friendId) {
			return reply.code(400).send({ ok: false, message: "userId & friendId is required" });
		}

		return await friendController.addFriendHandler(userId, friendId);
	});

	fastify.get("/users/:userId/friends", async (request, reply) =>
	{
		try {
			const { userId } = request.params;
			if (!userId) {
				return reply.code(400).send({ ok: false, message: "userId is required" });
			}
			const userIdnum = Number(userId);
			if (isNaN(userIdnum)) {
				return reply.code(400).send({ ok: false, message: "Invalid userId" });
			}
			const result = await friendController.listFriendsHandler(userIdnum);
			return reply.code(200).send({ ok: true,  result });
		}
		catch (error) {
			request.log.error(error);
			return reply.code(500).send({ ok: false, message: "Internal Server Error" });
		}

	});
}


module.exports = friendRoutes;