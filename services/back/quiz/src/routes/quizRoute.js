quizController = require('../controllers/quizController');
const schemas = require('../schemas/game.schemas');


async function quizRoutes(fastify, options) {

	/**
	 * Game Sessions Management
	 */
	// Input : mode, topic, number of questions, max_players, host_id
	// Output : game_session_id - create new code game session
	fastify.post('/game-sessions', {preHandler: fastify.authenticate, schema: schemas.createGameSessionSchema },
	async (request, reply) => {

		const userId = request.user.id;
		console.log("Creating game session for user ID:", userId);

		const gameSession = await quizController.createGameSession( request.body, userId);
		return reply.code(gameSession.code | 400).send(gameSession);
	});



	// Input : game_session_id
	// Output : game session details (questions, players, status)
	// fastify.get('/game-sessions/:id', async (request, reply) => {
	// });

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
		return reply.code(200).send({ status: 'Quiz service is healthy' });
	});
	console.log("Quiz routes registered");
}

module.exports = quizRoutes;