quizController = require('../controllers/quizController');
const schemas = require('../schemas/game.schemas');
const wsHub = require('../ws/wsHub');

async function quizRoutes(fastify, options) {

	/**
	 * @brief Create a new game session
	 * @input : mode, topic, number of questions, max_players, host_id, powerups
	 * @return : 200 + game session code if success, 401 if error
	 */
	fastify.post('/game-sessions', {preHandler: fastify.authenticate, schema: schemas.createGameSessionSchema },
	async (request, reply) => {
		const userId = request.user.id;
		console.log("User ID", userId, "is creating a new game session with settings:", request.body);
		try {
			const gameSession = await quizController.createGameSession( request.body, userId);
			console.log("Game session code:", gameSession);
			return reply.code(200).send({ status: gameSession.status, sessionCode: gameSession.sessionCode, sessionId: gameSession.sessionId });
		}
		catch (err) {
			console.error("Error creating game session:", err);
			return reply.code(err.code || 401).send({ status: 'Error creating game session', error: err.message });
		}
	});

	/**
	 * @brief Get details of a game session
	 * 		Details include questions, players, and status of the game session
	 * @input : game_session_id
	 * @return : 200 + game session details if success, 401 if not found
	 */
	fastify.get('/game-sessions/:id', {preHandler: fastify.authenticate, schema: schemas.GameSessionId},
	async (request, reply) => {
		const sessionId = Number(request.params.id);
		const sessionData = await quizController.getGameSessionData(sessionId);
		if (!sessionData) {
			return reply.code(404).send({ status: 'Game session not found' });
		}
		return reply.code(200).send({ status: 'Game session details', sessionData });
	});

	fastify.get('/game-sessions/code/:code', {preHandler: fastify.authenticate},
	async (request, reply) => {
		const code = request.params.code;
		const sessionData = await quizController.getGameSessionDataByCode(code);
		if (!sessionData) {
			return reply.code(400).send({ status: 'Game session not found' });
		}
		return reply.code(200).send({ status: 'Game session details', sessionData });
	});

	/**
	 * @brief Join a game session
	 * @input : game_session_id
	 * @rules : only if status is 'waiting' and max_players not reached
	 * @return : 200 if success, 400 if game session is full or already started, 401 if error
	 */
	fastify.post('/game-sessions/join', {preHandler: fastify.authenticate, schema: schemas.GameSessionCode},
	async (request, reply) => {
		const userId = request.user.id;
		console.log("User ID", userId, "is trying to join game session with code:", request.body.code);
		const { code } = request.body;
		try {
			const res = await quizController.joinGameSession(userId, code);
			return reply.code(200).send({ status: 'joined', gameSessionId: res.session_id });
		}
		catch (err)
		{
			if (err.message.includes("not found"))
				return reply.code(400).send({ status: 'Game session not found' });
			else if (err.message.includes("already started")
				|| err.message.includes("full"))
				return reply.code(400).send({ status: 'Cannot join game session', error: err.message });
			else if (err.message.includes("already joined"))
				return reply.code(409).send({ status: 'User has already joined this game session' });
			else {
				console.error("Error joining game session:", err);
				return reply.code(401).send({ status: 'Error joining game session', error: err.message });
			}
		}
	});

	/**
	 * @brief Start a game session
	 * @input : game_session_code
	 * @rules : only host can start, only if status is 'waiting' and at least 2 players joined
	 * @effects : change game session status to 'started', set started_at timestamp
	 * 			Select a pool of question based on the game session settings (mode, topic, question_count)
	 * 			and associate them with the game session
	 * @return : Confirmation
	 * @code 200 if success,
	 * 		 400 if not allowed, not enough players, or game session already started,
	 * 		 404 if session doesn't exist
	 * 		 403 if not host,
	 * 		 401 if error
	 */
	fastify.post(`/game-sessions/start`, {preHandler: fastify.authenticate, schema: schemas.GameSessionCode},
	async (request, reply) => {
		const userId = request.user.id;
		console.log("User ID", userId, "is trying to start game session with code:", request.body.code);
		const { code } = request.body;
		try {
			const res = await quizController.startGameSession(userId, code);
			return reply.code(200).send({ status: 'Game session started', gameSessionId: res.session_id });
		}
		catch(err)
		{
			if (err.message.includes("not found"))
				return reply.code(404).send({ error: err.message });
			else if (err.message.includes("not allowed") || err.message.includes("already started") || err.message.includes("players"))
				return reply.code(400).send({ error: err.message });
			else if (err.message.includes("not host"))
				return reply.code(403).send({ error: 'Only the host can start the game session' });
			else {
				console.error("Error starting game session:", err);
				return reply.code(401).send({ error: 'Error starting game session', error: err.message });
			}
		}
	});

	fastify.get(`/game-sessions/:id/current-question`, {preHandler: fastify.authenticate, schema: schemas.GameSessionId},
	async (request, reply) => {
		const userId = request.user.id;
		console.log("User ID", userId, "is requesting current question for game session ID:", request.params.id);
		const sessionId = Number(request.params.id);

		try {
			const {question, remaining_ms, status} = await quizController.getCurrentQuestion(userId, sessionId);
			if (!question)
			{
				console.log("No current question found for game session ID:", sessionId);

				return reply.code(400).send({ error: 'No current question found for this game session' });
			}
			return reply.code(200).send({ status: 'Current question retrieved', question: question, remaining_ms, game_status: status });
		} catch (err) {
			console.error("Error retrieving current question for game session:", err);
			return reply.code(401).send({ error: 'Error retrieving current question', error: err.message });
		}
	});

	fastify.get(`/game-sessions/:id/next-question`, {preHandler: fastify.authenticate},
	async (request, reply) => {
		const userId = request.user.id;
		const sessionId = Number(request.params.id);

		try {
			const {question, remaining_ms, status} = await quizController.getNextQuestion(userId, sessionId);
			if (!question)
			{
				console.log("No next question found for game session ID:", sessionId);
				return reply.code(200).send({ status: "completed", question: null, remaining_ms: 0 });
			}
			return reply.code(200).send({ status: 'Next question retrieved', question: question, remaining_ms, game_status: status });
		} catch (err) {
			console.error("Error retrieving next question for game session:", err);
			return reply.code(401).send({ error: 'Error retrieving next question', error: err.message });
		}
	});


	/**
	 * @brief Submit an answer for the current question in a game session
	 * @input : game_session_id, question_id, answer
	 * @rules : only if user is a player in the game session and status is 'in_progress'
	 */
	fastify.post('/game-sessions/:id/answer', {preHandler: fastify.authenticate},
	async (request, reply) => {
		const userId = Number(request.user.id);
		const sessionId = Number(request.params.id);
		const { question_id, answer} = request.body;

		console.log("Received answer submission for game session ID:", sessionId, "user ID:", userId, "question ID:", question_id, "answer:", answer);

		try {
			const res = await quizController.submitAnswer(sessionId, userId, question_id, answer);
			return reply.code(200).send({ status: 'Answer submitted', result: res });

		} catch (err) {
			console.error("Error submitting answer for game session:", err);
			if (err.message.includes("not found"))
				return reply.code(404).send({ error: err.message });
			else if (err.message.includes("not a player") || err.message.includes("not in progress"))
				return reply.code(400).send({ error: err.message });
			return reply.code(401).send({ error: 'Error submitting answer', error: err.message });
		}
	});

	fastify.delete('/game-sessions/:id/players/me', {preHandler: fastify.authenticate},
	async (request, reply) => {
		const userId = Number(request.user.id);
		console.log("User ID", userId, "is trying to leave game session with ID:", request.params.id);
		const session = Number(request.params.id);
		try {
			await quizController.leaveGameSession(session, userId);
			return reply.code(204).send();
		}
		catch (err) {
			console.log("Error leaving game session:", err);
			if (err.message.includes("not found"))
				return reply.code(404).send({ error: err.message });
			else if (err.message.includes("not a player"))
				return reply.code(400).send({ error: err.message });
			return reply.code(401).send({ error: 'Error leaving game session', error: err.message });
		}
	
	});

	// Input : game_session_id
	// Output : final leaderboard sort by score
	fastify.get('/game-sessions/:id/leaderboard', async (request, reply) => {
		const sessionId = Number(request.params.id);
		try {
			const {session, leaderboard} = await quizController.getLeaderboard(sessionId);
			wsHub.broadcast(sessionId, {type: 'leaderboard_update', payload: {sessionId, leaderboard}});
			return reply.code(200).send({ status: 'Leaderboard retrieved', session, leaderboard });
		}
		catch (err)
		{
			console.error("Error retrieving leaderboard for game session:", err);
			if (err.message.includes("not found"))
				return reply.code(404).send({ error: err.message });
			return reply.code(401).send({ error: 'Error retrieving leaderboard', error: err.message });
		}
	});

	fastify.get('/health', async (request, reply) => {
		return reply.code(200).send({ status: 'Quiz service is healthy' });
	});
	console.log("Quiz routes registered");


}

module.exports = quizRoutes;