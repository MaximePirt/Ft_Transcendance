// services/back/user/src/routes/friendRoute.js
const friendController = require("../controllers/friendController");
const friendWsHub = require("../ws/friendWsHub");

const AUTH_URL = process.env.AUTH_API_URL || false;
if (!AUTH_URL) {
	console.error("AUTH_API_URL environment variable is not set.");
	process.exit(1);
}

async function friendRoutes(fastify, options) {
	console.log("friendRoutes loaded");

	fastify.get("/friends/requests", async (request, reply) => {
		try {
			const cookieHeader = request.headers.cookie;
			if (!cookieHeader) {
				return reply.code(401).send({ ok: false, message: "No auth cookie" });
			}
			const meRes = await fetch(`${AUTH_URL}/me`, {
				method: "GET",
				headers: { cookie: cookieHeader },
			});
			if (!meRes.ok) {
				return reply.code(401).send({ ok: false, message: "Unauthorized" });
			}

			const me = await meRes.json();
			const meId = Number(me.id);
			if (Number.isNaN(meId)) {
				return reply.code(400).send({ ok: false, message: "Invalid userId" });
			}

			const result = await friendController.listFriendRequestsHandler(meId);
			return reply.code(result.statusCode || 200).send({
				ok: result.ok,
				received: result.received || [],
				sent: result.sent || [],
				message: result.message,
			});
		} catch (error) {
			request.log.error(error);
			return reply.code(401).send({ ok: false, message: "Internal Server Error" });
		}
	});

	fastify.delete("/:friendId/friends", async (request, reply) => {
		console.log("User try to delete friend");
		try {
			const cookieHeader = request.headers.cookie;
			if (!cookieHeader) {
				return reply.code(401).send({ ok: false, message: "No auth cookie" });
			}
			const meRes = await fetch(`${AUTH_URL}/me`, {
				method: "GET",
				headers: { cookie: cookieHeader },
			});
			if (!meRes.ok) {
				return reply.code(401).send({ ok: false, message: "Unauthorized" });
			}
			const me = await meRes.json();
			const meId = Number(me.id);

			const { friendId } = request.params;
			const friendIdnum = Number(friendId);

			if (isNaN(meId) || isNaN(friendIdnum)) {
				return reply.code(400).send({ ok: false, message: "Invalid userId or friendId" });
			}
			const res = await friendController.removeFriendHandler(meId, friendIdnum);
			if (res?.ok) {
				friendWsHub.notifyUsers([meId, friendIdnum], {
					type: "friend_updated",
					payload: { reason: "removed" },
				});
			}
			return reply.code(res.statusCode).send(res);
		} catch (error) {
			request.log.error(error);
			return reply.code(401).send({ ok: false, message: "Internal Server Error" });
		}
	});

	fastify.post("/:friendId/friends", async (request, reply) => {
		console.log("Received request to add friend");
		const cookieHeader = request.headers.cookie;
		if (!cookieHeader) {
			return reply.code(401).send({ ok: false, message: "No auth cookie" });
		}
		const meRes = await fetch(`${AUTH_URL}/me`, {
			method: "GET",
			headers: { cookie: cookieHeader },
		});
		if (!meRes.ok) {
			console.log("Failed to authenticate user:", meRes.status);
			return reply.code(401).send({ ok: false, message: "Unauthorized" });
		}
		console.log("Cookie Header:", cookieHeader);
		const me = await meRes.json();
		const meId = me.id;

		const friendId = request.params.friendId;
		const friendIdNum = Number(friendId);
		console.log("Friend ID from params:", friendId);
		if (Number.isNaN(friendIdNum)) {
			return reply.code(400).send({ ok: false, message: "Invalid friendId" });
		}
		console.log(`Adding friend ${friendId} to user ${meId}`);
		const res = await friendController.addFriendHandler(meId, friendIdNum);
		if (res?.ok && res?.created) {
			friendWsHub.notifyUsers([friendIdNum], {
				type: "friend_request_received",
				payload: { fromUserId: Number(meId) },
			});
		}
		if (res?.ok || res?.statusCode === 409) {
			friendWsHub.notifyUsers([Number(meId), friendIdNum], {
				type: "friend_updated",
				payload: { reason: res?.created ? "request_sent" : "request_answered" },
			});
		}

		console.log("Add Friend Response:", res);
		return reply.code(res.statusCode || 200).send(res);
	});

	fastify.get("/:userId/friends", async (request, reply) => {
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
			return reply.code(200).send({ ok: true, result });
		} catch (error) {
			request.log.error(error);
			return reply.code(401).send({ ok: false, message: "Internal Server Error" });
		}
	});

	fastify.get("/:friendId/status", async (request, reply) => {
		try {
			const cookieHeader = request.headers.cookie;
			if (!cookieHeader) {
				return reply.code(401).send({ ok: false, message: "No auth cookie" });
			}
			const meRes = await fetch(`${AUTH_URL}/me`, {
				method: "GET",
				headers: { cookie: cookieHeader },
			});
			if (!meRes.ok) {
				return reply.code(401).send({ ok: false, message: "Unauthorized" });
			}
			const me = await meRes.json();
			const meId = me.id;

			const { friendId } = request.params;
			const friendIdNum = Number(friendId);
			if (Number.isNaN(friendIdNum)) {
				return reply.code(400).send({ ok: false, message: "Invalid friendId" });
			}

			const status = await friendController.getFriendshipStatus(meId, friendIdNum);
			return reply.code(200).send({ ok: true, status });
		} catch (error) {
			request.log.error(error);
			return reply.code(401).send({ ok: false, message: "Internal Server Error" });
		}
	});
}

module.exports = friendRoutes;