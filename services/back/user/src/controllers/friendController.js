const friendModel = require("../models/friendModel");
const fs = require("fs");
const { pipeline } = require("stream/promises");
const path = require("path");

async function addFriendHandler(userId, friendId) {
	const res = await friendModel.addFriend(userId, friendId);
	if (!res.ok)
		throw new Error(res.message);
	return res;
}

async function removeFriendHandler(request, reply) {
	const userId = Number(request.user.id);
	const friendId = Number(request.params.friendId);

	if (!userId || !friendId)
		return reply.code(400).send({ ok: false, message: "Invalid input ID." });

	const res = await friendModel.removeFriend(userId, friendId);
	if (res.ok)
		return reply.code(200).send({ ok:true, info: res.info || "Friend removed successfully." });
	return reply.code(400).send({ ok:false, message: res.message });
}



module.exports = { addFriendHandler, removeFriendHandler };