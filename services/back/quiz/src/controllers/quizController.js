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

async function joinGameSession(userId, sessionCode)
{
	console.log("User ID", userId, "is trying to join game session with code:", sessionCode);
	const session = quizModel.getSessionByCode(sessionCode);
	if (!session)
		throw new Error("Game session not found");
	if (session.status !== 'waiting')
		throw new Error("Game session already started or ended : " + session.status);

	const players = quizModel.getPlayersBySession(session.id);
	if (players.length >= session.max_players)
		throw new Error("Game session is full");

	const alreadyJoined = players.some(player => player.id === userId);
	if (alreadyJoined) {
		console.log("User ID", userId, "has already joined game session with code:", sessionCode);
		throw new Error("User has already joined this game session");
	}

	quizModel.insertPlayerInGame(userId, session.id);
	console.log("User ID", userId, "successfully joined game session with code:", sessionCode);
	return { session_id: session.id, player: { user_id: userId } };
}

module.exports = {
	createGameSession,
	getGameSessionData,
	joinGameSession
};