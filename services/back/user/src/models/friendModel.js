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

const statusFriend = db.prepare(`
	SELECT initiator_id, status
	FROM friends
	WHERE user_id = ? AND friend_id = ?`);

const deleteFriend = db.prepare(`
	DELETE FROM friends
	WHERE user_id = ? AND friend_id = ?`);

const listFriend = db.prepare(`
  SELECT u.id, u.username, u.onlineStatus
  FROM friends f
  JOIN users u ON (f.friend_id = u.id OR f.user_id = u.id)
  WHERE (f.user_id = ? OR f.friend_id = ?)
  AND f.status = 'accepted'
  AND u.id != ?
`);

const listPendingReceived = db.prepare(`
  SELECT u.id, u.username, u.onlineStatus
  FROM friends f
  JOIN users u ON u.id = CASE WHEN f.user_id = ? THEN f.friend_id ELSE f.user_id END
  WHERE (f.user_id = ? OR f.friend_id = ?)
  AND f.status = 'pending'
  AND f.initiator_id != ?
`);

const listPendingSent = db.prepare(`
  SELECT u.id, u.username, u.onlineStatus
  FROM friends f
  JOIN users u ON u.id = CASE WHEN f.user_id = ? THEN f.friend_id ELSE f.user_id END
  WHERE (f.user_id = ? OR f.friend_id = ?)
  AND f.status = 'pending'
  AND f.initiator_id = ?
`);

const listRelatedUsers = db.prepare(`
  SELECT DISTINCT CASE
    WHEN user_id = ? THEN friend_id
    ELSE user_id
  END AS id
  FROM friends
  WHERE user_id = ? OR friend_id = ?
`);


//	Functions

function addFriend(userId, friendId) {
  if (userId === friendId)
    return { ok: false, message: "Impossible to add yourself as a friend." };

  var min = userId < friendId ? userId : friendId;
  var max = min === userId ? friendId : userId;

  let init_user = statusFriend.get(min, max);
  if (!init_user) {
    // No existing invite
    const info = inviteFriend.run(min, max, "pending", userId);
    if (info.changes === 1) return { ok: true, created: true, info, statusCode: 201 };

    init_user = statusFriend.get(min, max); // Check again
    if (!init_user)
      return {
        ok: false,
        created: false,
        statusCode: 401,
        message: "Insert conflicted, unknown error.",
      };
    if (init_user.status === "accepted")
      return {
        ok: false,
        created: false,
        statusCode: 409,
        message: "already friend",
      };
  }

  switch (init_user.initiator_id) {
    case friendId: {
      // Answer to existing invite
      const info = acceptFriend.run(min, max, friendId);
      if (info.changes === 1) return { ok: true, created: false, info };
      return {
        ok: false,
        created: false,
        statusCode: 401,
        message: "Error while accepting friend request.",
      };
    }
    case userId: {
      // Waiting from friendId
      return {
        ok: false,
        created: false,
        statusCode: 409,
        message: "Friend request already sent.",
      };
    }
    default:
      return { ok: false, created: false, statusCode: 401, message: "Unknown error." };
  }
}

function removeFriend(userId, friendId) {
  if (userId === friendId)
    return {
      ok: false,
      message: "Impossible to remove yourself from friends.",
    };

  var min = userId < friendId ? userId : friendId;
  var max = min === userId ? friendId : userId;

  const status = statusFriend.get(min, max);
  if (!status || (status.status !== "accepted" && status.status !== "pending"))
    return { ok: false, message: "No existing friendship or invitation." };

  const info = deleteFriend.run(min, max);
  if (info.changes === 1) return { ok: true, info };
  return { ok: false, message: "Error while removing friend." };
}

function listFriends(userId) {

  return listFriend.all(userId, userId, userId);
}

function listFriendRequestsReceived(userId) {
  return listPendingReceived.all(userId, userId, userId, userId);
}

function listFriendRequestsSent(userId) {
  return listPendingSent.all(userId, userId, userId, userId);
}


function getFriendshipStatus(userId, friendId) {
  var min = userId < friendId ? userId : friendId;
  var max = min === userId ? friendId : userId;

  const status = statusFriend.get(min, max);
  if (!status)
    return { ok: true, status: "none", initiator_id: null };
  return { ok: true, status: status.status, initiator_id: status.initiator_id };
}

function listRelatedUserIds(userId) {
  return listRelatedUsers
    .all(userId, userId, userId)
    .map((row) => Number(row.id))
    .filter((id) => Number.isInteger(id) && id > 0);
}

module.exports = {
  addFriend,
  removeFriend,
  listFriends,
  listFriendRequestsReceived,
  listFriendRequestsSent,
  getFriendshipStatus,
  listRelatedUserIds,
};
