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

async function removeFriendHandler(userId, friendId) {
    console.log(`Removing friend ${friendId} from user ${userId}`);

	if (!userId || !friendId)
		return ({ statusCode:400, ok: false, message: "Invalid input ID." });
	const res = await friendModel.removeFriend(userId, friendId);
	if (res.ok)
		return ({ statusCode:200, ok:true, info: res.info || "Friend removed successfully." });
	return ({ statusCode:400, ok:false, message: res.message });
}

async function listFriendsHandler(userId)
{
	try {
		if (!userId)
			return { statusCode:400, ok:false, message: "Invalid userId." };
		const friends = await friendModel.listFriends(userId);
		return { statusCode: 200, ok: true, friends };
	}
	catch (error) {
		return { statusCode:500, ok:false, message: "Internal Server Error." };
	}
}

module.exports = { addFriendHandler, removeFriendHandler, listFriendsHandler };