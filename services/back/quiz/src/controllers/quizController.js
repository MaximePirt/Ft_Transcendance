const quizModel = require('../models/quizModel');


/**
 * @brief Create a new game session
 * @param {*} sessionData - : mode, topic, number of questions, max_players
 * @param {*} hostId - ID of the user hosting the game
 * @return {*} game session code
 */

async function createGameSession(sessionData, hostId) {
	const { mode = "medium", topic = "general",
		question_count = 10, max_players = 4 } = sessionData;
	try {
		const sessionCode = quizModel.generateSessionCode();
		try {
			const insertGame = quizModel.insertGameSession(sessionCode, mode, topic, question_count, max_players, hostId);
			quizModel.insertPlayerInGame(hostId, insertGame.lastInsertRowid);
			console.log("Game session created with code:", sessionCode);
		}
		catch(err) {
			console.error("Error inserting game session into database or host into game_session:", err);
			throw new Error("Failed to create game session");
		}
		return (sessionCode);
	}
	catch (err) {
		console.error("Error generating session code:", err);
		throw new Error("Failed to create game session");
	}
}

async function getGameSessionData(sessionId)
{
	console.log("Fetching game session data for session ID:", sessionId);
	const session = quizModel.getSessionById(sessionId);
	if (!session) {
		console.log("No game session found for ID:", sessionId);
		return null;
	}
	const players = quizModel.getPlayersBySession(sessionId);
	session.players = players;
	console.log("Game session data with players:", session);
	return session;
}

module.exports = {
	createGameSession,
	getGameSessionData
};