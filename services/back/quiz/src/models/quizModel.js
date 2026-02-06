const db = require('./db');
const codeCreation = require('crypto');

function generateSessionCode()
{
	const res = codeCreation.randomBytes(3).toString('hex').toUpperCase();
	if (!res)
		throw new Error("Failed to generate session code");
	return res;
}

function insertGameSession(sessionCode, mode, topic, question_count, max_players, hostId)
{
	const insert = db.prepare(`
		INSERT INTO game_sessions (code, mode, topic, question_count, max_players, host_id)
		VALUES (?, ?, ?, ?, ?, ?)
	`);
	const result = insert.run(sessionCode, mode, topic, question_count, max_players, hostId);
	if (result.changes !== 1)
		throw new Error("Failed to insert game session into database");
	return result;
}

function insertPlayerInGame(playerId, gameSessionId)
{
	console.log("Inserting player ID:", playerId, "into game session ID:", gameSessionId);
	const insertPlayer = db.prepare(`
		INSERT INTO game_players (game_session_id, user_id)
		VALUES (?, ?)
	`);
	const result = insertPlayer.run(gameSessionId, playerId);
	if (result.changes !== 1)
		throw new Error("Failed to insert player into game players");
	return result;
}

function getSessionById(sessionId)
{
	console.log("Model : Fetching game session by ID:", sessionId);
	const data = db.prepare(`
		SELECT id, code, mode, topic, question_count, max_players, host_id, status, started_at, ended_at
		FROM game_sessions
		WHERE id = ?
	`).get(sessionId);
	console.log("Game session data retrieved:", data);
	return data;
}

function getSessionByCode(sessionCode)
{
	console.log("Model : Fetching game session by code:", sessionCode);
	const data = db.prepare(`
		SELECT id, code, mode, topic, question_count, max_players, host_id, status, started_at, ended_at
		FROM game_sessions
		WHERE code = ?
	`).get(sessionCode);
	console.log("Game session data retrieved:", data);
	return data;
}

function getPlayersBySession(sessionId)
{
	console.log("Model : Fetching all players for game session ID:", sessionId);
	const players = db.prepare(`
		SELECT u.id, u.username, gp.joined_at, gp.answered_count, gp.correct_answers, gp.score
		FROM game_players gp
		JOIN users u ON gp.user_id = u.id
		WHERE gp.game_session_id = ?
	`).all(sessionId);
	console.log("Players retrieved for session ID", sessionId, ":", players);
	return players;
}

function updateSessionStatus(sessionId, newStatus)
{
	console.log("Model: Updating status of game session ID:", sessionId, "to:", newStatus);
	const res = db.prepare(`
		UPDATE game_sessions
		SET status = ?,
		started_at = CASE WHEN ? = 'in_progress' THEN CURRENT_TIMESTAMP ELSE started_at END,
		ended_at = CASE WHEN ? IN ('completed', 'abandoned') THEN CURRENT_TIMESTAMP ELSE ended_at END
		WHERE id = ?
	`).run(newStatus, newStatus, newStatus, sessionId);
	if (res.changes !== 1)
		throw new Error("Failed to update game session status");
	return res;
}


function generateQuestionPool(mode, questionCount, topicJson)
{
	console.log("Model: Generating question pool with mode:", mode, "question count:", questionCount, "topic:", topicJson);
	let query = `
		SELECT q.id, q.difficulty, q.type, q.category_id
		FROM questions q
		WHERE 1 = 1
		`;
	let params = [];
	if (mode !== 'random')
	{
		query += ` AND q.difficulty = ?`;
		params.push(mode);
	}
	else
		console.log("Random mode selected, no difficulty filter applied for question pool generation");

	if (topicJson && topicJson !== 'null') {
		try {
			const topics = JSON.parse(topicJson);
			console.log("Parsed topic JSON for question pool generation:", topics);
			if (Array.isArray(topics) && topics.length > 0) {
				const placeholders = topics.map(() => '?').join(',');
				console.log("Applying topic filter for question pool generation with topics:", topics);
				query += ` AND q.category_id IN (
				SELECT id FROM categories WHERE slug IN (${placeholders})
			)`;
				params.push(...topics);
			}
			else
				console.log("No valid topics provided for question pool generation, skipping topic filter");
		}
		catch (err) {
			console.log("Failed to parse topic JSON:", err);
		}
	}
	else
		console.log("No topic filter applied for question pool generation");
	query += ` ORDER BY RANDOM() LIMIT ?`;
	params.push(questionCount);

	const questionPool = db.prepare(query).all(...params);
	console.log("Generated question pool:", questionPool);

	
	return questionPool;
}

function insertPoolToSession(sessionId, questionPool)
{
	console.log("Model: Inserting question pool into game session ID:", sessionId);
	const insert = db.prepare(`
		INSERT INTO game_session_questions (game_session_id, question_id, question_order)
		VALUES (?, ?, ?)
	`);
	const insertMany = db.transaction((questions) => {
		for (let i = 0; i < questions.length; i++) {
			const q = questions[i];
			insert.run(sessionId, q.id, i + 1);
		}
	});
	insertMany(questionPool);
	console.log("Inserted", questionPool.length, "questions into game session ID:", sessionId);

}


module.exports = {
	generateSessionCode,
	insertGameSession,
	insertPlayerInGame,
	getSessionById,
	getSessionByCode,
	getPlayersBySession,
	updateSessionStatus,
	generateQuestionPool,
	insertPoolToSession
};