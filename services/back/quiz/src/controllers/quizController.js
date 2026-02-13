const quizModel = require('../models/quizModel');
const { expireCurrentQuestion } = require('../jobs/expireCurrentQuestion');
const sessionTimer = require('../jobs/sessionTimer');
const wsHub = require('../ws/wsHub');


const QUESTION_TIMER = Number(process.env.QUESTION_TIMER || 15000);

/**
 * @brief Create a new game session
 * @param {*} sessionData - : mode, topic, number of questions, max_players
 * @param {*} hostId - ID of the user hosting the game
 * @return {*} game session code
 */

async function createGameSession(sessionData, hostId) {
	hostId = 1;
	const { mode, topic = null,
			question_count, max_players = 4 } = sessionData;

	const topicJson = topic && Array.isArray(topic) ? JSON.stringify(topic) : null;
	try {
		const sessionCode = quizModel.generateSessionCode();
		try {
			const insertGame = quizModel.insertGameSession(sessionCode, mode, topicJson, question_count, max_players, hostId);
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

	const alreadyJoined = quizModel.findUserInSession(session.id, userId);
	if (alreadyJoined && alreadyJoined.is_active) {
		console.log("User ID", userId, "has already joined game session with code:", sessionCode);
		throw new Error("User has already joined this game session");
	}
	else if (alreadyJoined && !alreadyJoined.is_active) {
		console.log("User ID", userId, "had previously joined game session with code:", sessionCode, "but was marked inactive. Re-activating player.");
		quizModel.setPlayerActive(session.id, userId, true);
	}
	else
		quizModel.insertPlayerInGame(userId, session.id);
	const player_name = quizModel.getPlayerName(userId);
	wsHub.broadcast(session.id, { type: 'player_joined', payload: { userId, player_name } });
	console.log("User ID", userId, "successfully joined game session with code:", sessionCode);
	const currentPlayers = quizModel.getPlayersBySession(session.id);
	console.log("Current players in session ID", session.id, "after user joined:", currentPlayers);
	wsHub.broadcast(session.id, { type: 'scoreboard_updated', payload: { sessionId: session.id, players: currentPlayers } });
	return { session_id: session.id, player: { user_id: userId } };
}

async function startGameSession(userId, sessionCode)
{
	console.log("User ID", userId, "is trying to start game session with code:", sessionCode);
	const session = quizModel.getSessionByCode(sessionCode);
	if (!session)
		throw new Error("Game session not found");
	if (session.status !== 'waiting')
		throw new Error("Game session already started or ended : " + session.status);
	if (session.host_id !== userId)
		throw new Error("Only the host can start the game session");
	console.log("Inputs validated. Starting game session with code:", sessionCode);
	const players = quizModel.getPlayersBySession(session.id);
	if (players.length < 1)
		throw new Error("At least 1 player is required to start the game session");
	console.log(players.length, "players have joined the game session. Starting the game...");
	try {
		quizModel.updateSessionStatus(session.id, 'in_progress');
		console.log("Generating question pool for game session ID:", session.id);
		const questionPool = quizModel.generateQuestionPool(session.mode, session.question_count, session.topic);
		if (questionPool.length < session.question_count)
			throw new Error("Not enough questions available to start the game session");
		quizModel.insertPoolToSession(session.id, questionPool);
		quizModel.initSessionQuestionTimer(session.id);
		sessionTimer.scheduleTimer(session.id, expireCurrentQuestion);
		wsHub.broadcast(session.id, {type: 'game_started', payload: { sessionId: session.id }});
		wsHub.broadcast(session.id, {type: 'question_started', payload: {sessionId: session.id, question_order: session.current_question_order,
			remaining_ms: quizModel.getRemainingMs(session.id, QUESTION_TIMER)}});
		console.log("Session", session.id, "started with", questionPool.length, "questions");
		return {code: 200, session_id: session.id};
	}
	catch (err) {
		throw new Error("Failed to start game session: " + err.message);
	}
}

async function getCurrentQuestion(userId, sessionId)
{
	const session = quizModel.getSessionById(sessionId);
	if (!session)
		throw new Error("Game session not found");
	if (session.status !== 'in_progress')
		throw new Error("Game session is not in progress : " + session.status);
	const player = quizModel.findUserInSession(sessionId, userId);
	if (!player)
		throw new Error("User is not a player in this game session");

	const remaining_ms = quizModel.getRemainingMs(sessionId, QUESTION_TIMER);

	const order = session.current_question_order;
	if (!order)
		return { game_status: 'in_progress', question: null, remaining_ms };

	const question = quizModel.getQuestionByOrderForPlayer(sessionId, order, player.lang);
	if (!question && session.current_question_order > quizModel.getTotalQuestionsForSession(sessionId))
	{
		quizModel.updateSessionStatus(sessionId, 'completed');
		return { game_status: 'completed', question: null, remaining_ms: 0 };
	}
	else if (!question)
		throw new Error("No current question found for this game session");
	console.log("Current question for user ID", userId, "in game session ID:", sessionId, ":", question);
	return { game_status: session.status, question, remaining_ms };
}

async function submitAnswer(sessionId, userId, question_id, answer)
{
	question_id = Number(question_id);
	const session = quizModel.getSessionById(sessionId);
	if (!session)
		throw new Error("Game session not found");
	if (session.status !== 'in_progress')
		throw new Error("Game session is not in progress : " + session.status);
	const player = quizModel.findUserInSession(sessionId, userId);
	if (!player)
		throw new Error("User is not a player in this game session");
	
	const currentQuestionId = quizModel.getCurrentQuestionId(sessionId);
	if (!currentQuestionId || currentQuestionId !== question_id)
		throw new Error("This question is not the current question for the player");

	const AlreadyAnswered = quizModel.getPlayerAnswerForQuestion(sessionId, userId, question_id);
	if (AlreadyAnswered)
		throw new Error("Player has already submitted an answer for this question");

	const time_taken = quizModel.getTimeTakenFromSession(sessionId);
	if (time_taken === null)
		throw new Error("No timer found for this question and player");

	const question_answer = quizModel.getCorrectAnswerForQuestion(question_id, player.lang);
	const isCorrect = quizModel.checkAnswer(question_answer, answer);
	console.log("isCorrect variable just after calling checkAnswer:", isCorrect);

	quizModel.recordPlayerAnswer(sessionId, userId, question_id, answer, time_taken, isCorrect);

	quizModel.updatePlayerScore(sessionId, userId, isCorrect, time_taken);

	if (quizModel.haveAllPlayersAnswered(sessionId, question_id)) {
		sessionTimer.clearTimer(sessionId);
		const { status, new_order } = quizModel.advanceSession(sessionId);
		const players = quizModel.getPlayersBySession(sessionId);
		wsHub.broadcast(sessionId, { type: 'scoreboard_updated', payload: { sessionId, players } });
		if (status === 'in_progress')
		{
			sessionTimer.scheduleTimer(sessionId, expireCurrentQuestion);
			const remaining_ms = quizModel.getRemainingMs(sessionId, QUESTION_TIMER);
			wsHub.broadcast(sessionId, {type: 'question_started', payload: {sessionId, question_order: new_order, remaining_ms : remaining_ms, }});

		}
		else if (status === 'completed')
			wsHub.broadcast(sessionId, {type: 'session_completed', payload: {sessionId}});
	}
	const updatedPlayer = quizModel.findUserInSession(sessionId, userId);
	console.log("User ID", userId, "submitted answer for question ID", question_id, "in game session ID:", sessionId, "Correct:", isCorrect);
	const result = {
		is_correct: isCorrect,
		current_score: updatedPlayer.score,
		correct_answers: question_answer,
		total_correct: updatedPlayer.correct_answers,
		total_answered: updatedPlayer.answered_count
	};
	return result;
}


async function leaveGameSession(sessionId, userId)
{
	const session = quizModel.getSessionById(sessionId);
	if (!session)
		throw new Error("Game session not found");
	const player = quizModel.findUserInSession(sessionId, userId);
	if (!player || player.is_active === 0)
		return ;
	console.log("User ID", userId, "is leaving game session ID:", sessionId);
	quizModel.setPlayerActive(sessionId, userId, false);
	wsHub.broadcast(sessionId, { type: 'player_left', payload: { sessionId, userId } });
	if (session.host_id === userId)
	{
		const nextHost = quizModel.getNextActivePlayer(sessionId, userId);
		if (nextHost?.user_id)
		{
			quizModel.transferHost(sessionId, nextHost.user_id);
			console.log("Host left the game session. Transferred host role to user ID:", nextHost.user_id);
			wsHub.broadcast(sessionId, { type: 'host_transferred', payload: { newHostId: nextHost.user_id } });
		}
		else
		{
			quizModel.updateSessionStatus(sessionId, 'abandoned');
			wsHub.broadcast(sessionId, { type: 'session_ended', payload: { sessionId } });
			return ;
		}
	}
	const currentPlayers = quizModel.getPlayersBySession(sessionId);
	wsHub.broadcast(sessionId, { type: 'scoreboard_updated', payload: { sessionId, players: currentPlayers } });
	if (session.status === 'in_progress')
	{
		const question_id = quizModel.getCurrentQuestionId(sessionId);
		if (quizModel.haveAllPlayersAnswered(sessionId, question_id))
		{
			sessionTimer.clearTimer(sessionId);
			const { status, new_order } = quizModel.advanceSession(sessionId);
			if (status === 'in_progress')
			{
				sessionTimer.scheduleTimer(sessionId, expireCurrentQuestion);
				const remaining_ms = quizModel.getRemainingMs(sessionId, QUESTION_TIMER);
				wsHub.broadcast(sessionId, {type: 'question_started', payload: {sessionId, question_order: new_order, remaining_ms : remaining_ms, }});
			}
			else
				wsHub.broadcast(sessionId, {type: 'session_completed', payload: {sessionId}});
		}
	}
}

async function getLeaderboard(sessionId)
{
	const session = quizModel.getSessionById(sessionId);
	if (!session)
		throw new Error("Game session not found");
	const leaderboard = quizModel.getLeaderboardForSession(sessionId);
	return leaderboard;
	
}


module.exports = {
	createGameSession,
	getGameSessionData,
	joinGameSession,
	startGameSession,
	getCurrentQuestion,
	submitAnswer,
	leaveGameSession,
	getLeaderboard
};