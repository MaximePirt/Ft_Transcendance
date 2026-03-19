const friendModel = require("../models/friendModel");
const fs = require("fs");
const { pipeline } = require("stream/promises");
const path = require("path");

async function addFriendHandler(userId, friendId) {
	const res = await friendModel.addFriend(userId, friendId);
	if (!res.ok)
		return { ok: res.ok, message: res.message, statusCode: res.statusCode, created: res.created };
	return { ok: res.ok, created: res.created, info: res.info, statusCode: res.statusCode };
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
		return { statusCode:401, ok:false, message: "Internal Server Error." };
	}
}

async function listFriendRequestsHandler(userId)
{
	try {
		if (!userId)
			return { statusCode:400, ok:false, message: "Invalid userId." };
		const received = await friendModel.listFriendRequestsReceived(userId);
		const sent = await friendModel.listFriendRequestsSent(userId);
		return { statusCode: 200, ok: true, received, sent };
	}
	catch (error) {
		return { statusCode:401, ok:false, message: "Internal Server Error." };
	}
}



async function getFriendshipStatus(userId, friendId)
{
	const res = await friendModel.getFriendshipStatus(userId, friendId);
	return res;
}

module.exports = {
	addFriendHandler,
	removeFriendHandler,
	listFriendsHandler,
	listFriendRequestsHandler,
	getFriendshipStatus,
};