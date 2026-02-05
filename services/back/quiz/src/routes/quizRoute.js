quizController = require('../controllers/quizController');
const schemas = require('../schemas/game.schemas');


async function quizRoutes(fastify, options) {

	/**
	 * @brief Create a new game session
	 * @input : mode, topic, number of questions, max_players, host_id
	 * @return : 200 + game session code if success, 500 if error
	 */
	fastify.post('/game-sessions', {preHandler: fastify.authenticate, schema: schemas.createGameSessionSchema },
	async (request, reply) => {
		userId = 1;
		request.body = {
			mode: 'medium',
			topic: 'general',
		};
		try {
			const gameSession = await quizController.createGameSession( request.body, userId);
			console.log("Game session code:", gameSession);
		}
		catch (err) {
			console.error("Error creating game session:", err);
			return reply.code(500).send({ status: 'Error creating game session', error: err.message });
		}
		return reply.code(200).send({ status: 'Game session created', gameSession});
	});



	/**
	 * @brief Get details of a game session
	 * 		Details include questions, players, and status of the game session
	 * @input : game_session_id
	 * @return : 200 + game session details if success, 500 if not found
	 */
	fastify.get('/game-sessions/:id', {preHandler: fastify.authenticate, schema: schemas.GameSessionId},
	async (request, reply) => {
		const sessionId = request.params.id;
		const sessionData = await quizController.getGameSessionData(sessionId);
		if (!sessionData) {
			return reply.code(404).send({ status: 'Game session not found' });
		}
		return reply.code(200).send({ status: 'Game session details', sessionData });
	});

	/**
	 * @brief Join a game session
	 * @input : game_session_id
	 * @rules : only if status is 'waiting' and max_players not reached
	 * @return : 200 if success, 400 if game session is full or already started, 500 if error
	 */
	fastify.post('/game-sessions/join', {preHandler: fastify.authenticate, schema: schemas.JoinGameSessionSchema},
	async (request, reply) => {
		const userId = request.user.id;
		const { code } = request.body;
		try {
			const res = await quizController.joinGameSession(userId, code);

			// TODO: Websocket broadcast to notify other players in the session that a new player has joined
    		// fastify.websocketBroadcast(result.session_id, 'player_joined', { userId });

			return reply.code(200).send({ status: 'joined', gameSessionId: res.session_id });
		}
		catch (err)
		{
			if (err.message.includes("not found"))
				return reply.code(404).send({ status: 'Game session not found' });
			else if (err.message.includes("already started")
				|| err.message.includes("full"))
				return reply.code(400).send({ status: 'Cannot join game session', error: err.message });
			else if (err.message.includes("already joined"))
				return reply.code(409).send({ status: 'User has already joined this game session' });
			else {
				console.error("Error joining game session:", err);
				return reply.code(500).send({ status: 'Error joining game session', error: err.message });
			}
		}
	});

	// Input : game_session_id, player_id, answer
	// Effect : insert in game_answer, update player score
	// Output : success/failure 
	// fastify.post('/game-sessions/:id/answer', async (request, reply) => {
	// });

	// Input : game_session_id
	// Output : final leaderboard sort by score
	// fastify.get('/game-sessions/:id/leaderboard', async (request, reply) => {
	// });

	fastify.get('/health', async (request, reply) => {
		userId = 1;
		request.body = {
			mode: 'medium',
			topic: 'general',
		};
		try {
			const gameSession = await quizController.createGameSession( request.body, userId);
			console.log("Health check - game session details:", gameSession);
		}
		catch (err) {
			console.error("Health check - error creating game session:", err);
			return reply.code(500).send({ status: 'Quiz service unhealthy', error: err.message });
		}
		return reply.code(200).send({ status: 'Quiz service is healthy' });
	});
	console.log("Quiz routes registered");
}

module.exports = quizRoutes;