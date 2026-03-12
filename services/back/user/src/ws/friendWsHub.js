const friendModel = require("../models/friendModel");
const userModel = require("../models/userModel");

const USER_ROOMS = new Map();
const LAST_ACTIVITY = new Map();
const ONLINE_USERS = new Set();

const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000;
const CHECK_INTERVAL_MS = 30 * 1000;

function add(userId, socket) {
  const id = Number(userId);
  if (!USER_ROOMS.has(id)) USER_ROOMS.set(id, new Set());
  USER_ROOMS.get(id).add(socket);
  markActivity(id);
}

function remove(userId, socket) {
  const id = Number(userId);
  const sockets = USER_ROOMS.get(id);
  if (!sockets) return;
  sockets.delete(socket);
  if (sockets.size === 0) {
    USER_ROOMS.delete(id);
    LAST_ACTIVITY.delete(id);
    setUserOnlineStatus(id, false);
  }
}

function notifyUsers(userIds, event) {
  const message = JSON.stringify(event);
  const uniqueIds = Array.from(new Set((userIds || []).map(Number)));

  for (const id of uniqueIds) {
    const sockets = USER_ROOMS.get(id);
    if (!sockets) continue;
    for (const socket of sockets) {
      if (socket.readyState === 1) {
        socket.send(message);
      }
    }
  }
}

function setUserOnlineStatus(userId, online) {
  const id = Number(userId);
  if (!Number.isInteger(id) || id <= 0) return;

  const isCurrentlyOnline = ONLINE_USERS.has(id);
  if (online === isCurrentlyOnline) return;

  try {
    userModel.updateUserById(id, { onlineStatus: online ? 1 : 0 });
  } catch {
    return;
  }

  if (online) ONLINE_USERS.add(id);
  else ONLINE_USERS.delete(id);

  const relatedUsers = friendModel.listRelatedUserIds(id);
  notifyUsers([id, ...relatedUsers], {
    type: "presence_updated",
    payload: { userId: id, online },
  });
}

function markActivity(userId) {
  const id = Number(userId);
  if (!Number.isInteger(id) || id <= 0) return;

  LAST_ACTIVITY.set(id, Date.now());
  setUserOnlineStatus(id, true);
}

const timer = setInterval(() => {
  const now = Date.now();

  for (const [userId, lastActivity] of LAST_ACTIVITY.entries()) {
    if (now - lastActivity >= INACTIVITY_TIMEOUT_MS) {
      setUserOnlineStatus(userId, false);
    }
  }
}, CHECK_INTERVAL_MS);

if (typeof timer.unref === "function") {
  timer.unref();
}

module.exports = {
  add,
  remove,
  notifyUsers,
  markActivity,
};
