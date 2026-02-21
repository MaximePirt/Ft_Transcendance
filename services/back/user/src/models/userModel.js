const bcrypt = require('bcryptjs');
const db = require('./db');

async function findAllUsers() {
	var res = db.prepare('SELECT * FROM users').all();
	console.log("-------\n" + JSON.stringify(res) + "-----\n");
	return res;
}

async function findUser(username, password) {
	if (!db.prepare('SELECT username FROM users WHERE username = ?').get(username))
		return 'unknown user'
	const bddpass = await db.prepare('SELECT password FROM users WHERE username = ?').get(username);
	// const match = await bcrypt.compare(password, bddpass.password);
	// if (!match)
	// 	return "bad password"
}

function findUserById(id) {
	return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

function findUserByUsername(username) {
	const res = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
	if (!res)
		return null;
	return res;
}

function updateUserById(id, data) {
	const fields = Object.keys(data);
	if (fields.length === 0)
		return null;
	const setClause = fields.map(field => `${field} = ?`).join(', ');
	const values = fields.map(field => data[field]);
	values.push(id);

	const stmt = db.prepare(`UPDATE users SET ${setClause} WHERE id = ?`);

	let info;
	try {
		info = stmt.run(...values);
	}
	catch (err) {
		const errorMsg = String(err);

		if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' && errorMsg.includes('users.email'))
			throw new Error('Email already taken by another account');
		if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' && errorMsg.includes('users.username'))
			throw new Error('Username already taken by another account');

		throw err;
	}
	if (info.changes === 0)
		return null;

	return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

function findRecentMatchesByUserId(userId, limit = 3) {
	const safeLimit = Math.max(1, Math.min(Number(limit) || 3, 10));
	return db.prepare(`
		SELECT
			gs.id AS sessionId,
			gs.mode,
			gs.status,
			gs.started_at AS startedAt,
			gs.ended_at AS endedAt,
			gs.question_count AS totalQuestions,
			gp.score,
			gp.correct_answers AS correctAnswers,
			gp.answered_count AS answeredCount
		FROM game_players gp
		JOIN game_sessions gs ON gs.id = gp.game_session_id
		WHERE gp.user_id = ?
		ORDER BY COALESCE(gs.ended_at, gs.started_at, gp.joined_at) DESC
		LIMIT ?
	`).all(userId, safeLimit);
}

module.exports = {
	findAllUsers,
	findUserById,
	findUserByUsername,
	updateUserById,
	findUser,
	findRecentMatchesByUserId
};
