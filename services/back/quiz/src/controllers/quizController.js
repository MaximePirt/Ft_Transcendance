const quizModel = require('../models/quizModel');


/**
 * @brief Create a new game session
 * @param {*} sessionData - : mode, topic, number of questions, max_players
 * @param {*} hostId - ID of the user hosting the game
 * @return {*} game session code
 */

/*
	Steps :
	1. Validate input data (handled by schema)
	2. Generate unique game session code
	3. Insert new game session into database with status 'waiting' and adding host as first player
	4. Return game session details including code
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
		console.error("Error generating session code:", err);c
		throw new Error("Failed to create game session");
	}
}

module.exports = {
	createGameSession
};