const db = require("./db");

//	SQL commands
const inviteFriend = db.prepare(`
	INSERT INTO friends (user_id, friend_id, status, initiator_id)
	VALUES (?, ?, ?, ?)
	ON CONFLICT(user_id, friend_id) DO NOTHING`);

const acceptFriend = db.prepare(`
	UPDATE friends
	SET status = 'accepted'
	WHERE user_id = ? AND friend_id = ? AND status = 'pending' AND initiator_id = ?`);

const initiator = db.prepare(`
	SELECT initiator_id, status
	FROM friends
	WHERE user_id = ? AND friend_id = ?`);


const deleteFriend = db.prepare(`
	DELETE FROM friends
	WHERE user_id = ? AND friend_id = ?`);

//	Functions



function addFriend(userId, friendId)
{
	if (userId === friendId)
		return { ok: false, message: "Impossible to add yourself as a friend." };

	var min = userId < friendId ? userId : friendId;
	var max = min === userId ? friendId : userId;

	let init_user = initiator.get(min, max);
	if (!init_user) // No existing invite
	{
		const info = inviteFriend.run(min, max, 'pending', userId);
		if (info.changes === 1)
			return { ok: true, created: true, info };

		init_user = initiator.get(min, max); // Check again
		if (!init_user)
			return { ok: false, created:false, message: "Insert conflicted, unknown error." };
		if (init_user.status === 'accepted')
			return { ok: false, created: false, message: "Already friends" };
	}


	switch (init_user.initiator_id)
	{
		case friendId: { // Answer to existing invite
			const info = acceptFriend.run(min, max, friendId);
			if (info.changes === 1)
				return { ok: true, created:false, info };
			return { ok: false, created:false, message: "Error while accepting friend request." };
		}
		case userId: { // Waiting from friendId
			return { ok: false, created:false, message: "Friend request already sent." };
		}
		default:
			return { ok: false, created:false, message: "Unknown error." };
	}

}

module.exports = { addFriend };
