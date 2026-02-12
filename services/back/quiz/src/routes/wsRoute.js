// src/routes/wsRoute.js
const wsHub = require('../ws/wsHub');
const quizModel = require('../models/quizModel');
const QUESTION_TIMER = Number(process.env.QUESTION_TIMER || 15000);


/**
 * @brief Websocket route for quiz game sessions
 * @param {*} fastify 
 * @note To add a new communication type :
 * 		socket.on('type', (data) => {* // Handle incoming data of this type * });
 */

module.exports = async function wsRoutes(fastify) {

	fastify.get('/ws/game-sessions/:id', {websocket: true},
	(socket, req) => {
		const sessionId = Number(req.params.id);
		const userId = 1;
		// const userId = req.user.id;

		const player = quizModel.findUserInSession(sessionId, userId);
		if (!player) {
			socket.send(JSON.stringify({ type: 'error', payload: 'Not a player in this session' }));
			socket.close(1008, 'Not in session');
			return;
		}

		wsHub.add(sessionId, socket);

		const session = quizModel.getSessionById(sessionId);
		if (session?.status === 'in_progress' && session.current_question_order)
		{
			const question = quizModel.getQuestionByOrderForPlayer(
			sessionId,
			session.current_question_order,
			player.lang
			);
			const remaining_ms = quizModel.getRemainingMs(sessionId, QUESTION_TIMER);

			socket.send(JSON.stringify({
				type: 'question_started',
				payload: { sessionId, question, remaining_ms, game_status: session.status }
			}));
		} 
		else {
			socket.send(JSON.stringify({
			type: 'session_state',
			payload: { sessionId, game_status: session?.status ?? 'unknown' }
			}));
		}

		socket.on('close', () => {
			wsHub.remove(sessionId, socket);
		});
	});
};

