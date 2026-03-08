const rooms = new Map();

function add(sessionId, socket) {
	sessionId = Number(sessionId);
	if (!rooms.has(sessionId))
		rooms.set(sessionId, new Set());
	rooms.get(sessionId).add(socket);
}

function remove(sessionId, socket) {
	sessionId = Number(sessionId);
	const set = rooms.get(sessionId);
	if (!set)
		return;
	set.delete(socket);
	if (set.size === 0)
		rooms.delete(sessionId);
}

function broadcast(sessionId, event) {
	sessionId = Number(sessionId);
	const set = rooms.get(sessionId);
	if (!set)
		return;

	const msg = JSON.stringify(event);
	for (const ws of set) {
		if (ws.readyState === 1)
			ws.send(msg);
	}
}

module.exports = { add, remove, broadcast };
