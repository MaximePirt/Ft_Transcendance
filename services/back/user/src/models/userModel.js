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


/** 
* @brief : databases query from stats routes
* @input : user_id
* @rules : only if user exists
* @return : a JSON object containing user statistics

*/
function findUserStatsById(userId)
{
	const total_matches = db.prepare(`
		SELECT COUNT(*) as cnt
		FROM game_players
		JOIN game_sessions gs ON gs.id = game_players.game_session_id
		WHERE user_id = ? AND game_session_id IN (SELECT id FROM game_sessions WHERE is_solo = 0)
	`).get(userId).cnt || 0;


	const wins = db.prepare(`
		SELECT COUNT(*) as cnt
		FROM game_players gp
		JOIN game_sessions gs ON gs.id = gp.game_session_id
		WHERE gp.user_id = ? AND gp.is_winner = 1 AND gs.status = 'completed' AND gs.is_solo = 0
	`).get(userId).cnt || 0;

	const total_score = db.prepare(`
		SELECT SUM(score) as total
		FROM game_players
		WHERE user_id = ? AND game_session_id IN (SELECT id FROM game_sessions WHERE is_solo = 0)
	`).get(userId).total || 0;

	const win_rate = total_matches > 0 ? (wins / total_matches) * 100 : 0;

	const answered = db.prepare(`
		SELECT SUM(answered_count) as total
		FROM game_players
		WHERE user_id = ? AND game_session_id IN (SELECT id FROM game_sessions WHERE is_solo = 0)
	`).get(userId).total || 0;

	const correct = db.prepare(`
		SELECT SUM(correct_answers) as total
		FROM game_players
		WHERE user_id = ? AND game_session_id IN (SELECT id FROM game_sessions WHERE is_solo = 0)
	`).get(userId).total || 0;

	const accuracy = answered > 0 ? (correct / answered) * 100 : 0;

	return {
		total_matches,
		wins,
		total_score,
		answered,
		correct,
		win_rate: parseFloat(win_rate.toFixed(2)),
		accuracy: parseFloat(accuracy.toFixed(2))
	};
}

function findWinsLeaderboard(limit = 5) {
	const safeLimit = Math.max(1, Math.min(Number(limit) || 5, 10));
	return db.prepare(`
		SELECT
			u.id,
			u.username,
			SUM(CASE WHEN gp.is_winner = 1 THEN 1 ELSE 0 END) AS wins
		FROM game_players gp
		JOIN game_sessions gs ON gs.id = gp.game_session_id
		JOIN users u ON u.id = gp.user_id
		WHERE gs.status = 'completed' AND gs.is_solo = 0
		GROUP BY u.id, u.username
		HAVING wins > 0
		ORDER BY wins DESC, u.username ASC
		LIMIT ?
	`).all(safeLimit);
}

function deleteUserById(userId) {
	const stmt = db.prepare(`DELETE FROM users WHERE id = ?`).run(userId);
	return (stmt);
}

function findUserInAGame(userId) {
	const stmt = db.prepare(`
		SELECT 1
		FROM game_players gp
		JOIN game_sessions gs ON gs.id = gp.game_session_id
		WHERE gp.user_id = ?
		AND gs.status IN ('waiting', 'in_progress')
		AND gp.is_active = 1
		LIMIT 1
	`).get(userId)

	return (stmt);
}

module.exports = {
	findAllUsers,
	findUserById,
	findUserByUsername,
	updateUserById,
	findUser,
	findRecentMatchesByUserId,
	findUserStatsById,
	findWinsLeaderboard,
	deleteUserById,
	findUserInAGame
};
