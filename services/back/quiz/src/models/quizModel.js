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

module.exports = {
	generateSessionCode,
	insertGameSession,
	insertPlayerInGame,
	getSessionById,
	getPlayersBySession
};