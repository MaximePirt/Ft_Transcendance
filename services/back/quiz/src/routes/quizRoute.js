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

	fastify.get('/test', async (request, reply) => {
		const sessionId = 1;
		const sessionData = await quizController.getGameSessionData(sessionId);
		if (!sessionData) {
			return reply.code(404).send({ status: 'Game session not found' });
		}
		return reply.code(200).send({ status: 'Game session details', sessionData });
	});

	// Input : game_session_id, player_id
	// Rules : only if status is 'waiting' and max_players not reached
	// Output : success/failure
	// fastify.post('/game-sessions/:id/join', async (request, reply) => {
	// });

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