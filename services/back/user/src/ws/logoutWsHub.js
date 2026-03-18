const USER_SOCKETS = new Map();

function add(userId, socket) {
    const id = Number(userId);
    if (!USER_SOCKETS.has(id)) USER_SOCKETS.set(id, new Set());
    USER_SOCKETS.get(id).add(socket);
}

function remove(userId, socket) {
    const id = Number(userId);
    const sockets = USER_SOCKETS.get(id);
    if (!sockets) return;
    sockets.delete(socket);
    if (sockets.size === 0) {
        USER_SOCKETS.delete(id);
    }
}

function notifyUsers(userIds, event) {
    const message = JSON.stringify(event);
    const uniqueIds = Array.from(new Set((userIds || []).map(Number)));

    for (const id of uniqueIds) {
        const sockets = USER_SOCKETS.get(id);
        if (!sockets) continue;
        for (const socket of sockets) {
            if (socket.readyState === 1) {
                socket.send(message);
            }
        }
    }
}

function broadcast(userId, event) {
	userId = Number(userId);
	const set = USER_SOCKETS.get(userId);
	if (!set)
		return;

	const msg = JSON.stringify(event);
	for (const ws of set) {
		if (ws.readyState === 1)
			ws.send(msg);
	}
}

module.exports = { add, remove, notifyUsers, broadcast };