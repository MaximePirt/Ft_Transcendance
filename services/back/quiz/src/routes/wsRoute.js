const wsHub = require('../ws/wsHub');
const quizModel = require('../models/quizModel');
const quizController = require('../controllers/quizController');
const QUESTION_TIMER = Number(process.env.QUESTION_TIMER || 15000);


/**
 * @brief Websocket route for quiz game sessions
 * @param {*} fastify 
 */

module.exports = async function wsRoutes(fastify) {

	fastify.get('/ws/game-sessions/:id', {preHandler: fastify.authenticate, websocket: true},
	(socket, req) => {
		const sessionId = Number(req.params.id);
		const userId = req.user.id;

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
		socket.on('message', async (data) => {
			let msg;
			try {
				msg = JSON.parse(data.toString());
			} catch {
				return;
			}
			if (msg.type === 'sync_request') {
				const session = quizModel.getSessionById(sessionId);
				socket.send(JSON.stringify({
					type: 'session_state',
					payload: { sessionId, game_status: session?.status ?? 'unknown' }
				}));
			}
			else if (msg.type === 'powerup_use') {
				const { powerupId} = msg.payload ?? {};
				if (!powerupId)
				{
					socket.send(JSON.stringify({
						type: 'error',
						payload: { ok: false, error: 'Missing powerupId' }
					}));
					return;
				}
				try {
					const result = await quizController.usePowerup(sessionId, userId, powerupId);
					if (!result || !result.ok)
					{
						return socket.send(JSON.stringify({
							type: 'powerup_use_error',
							payload: { ok: false, error: result?.error || 'Failed to use powerup' }
						}));
					}
					socket.send(JSON.stringify({ type: 'powerup_used', payload: { ok: true, ...result } }));
					wsHub.broadcast(sessionId, {type: 'powerup_used_broadcast', payload: { sessionId, userId, powerupId} });

				} catch (e) {
					socket.send(JSON.stringify({
						type: 'powerup_use_error',
						payload: { ok: false, error: e.message }
					}));
				}
			}
		});

		socket.on('close', () => {
			wsHub.remove(sessionId, socket);
			wsHub.broadcast(sessionId, { type: 'player_left', payload: { sessionId, userId } });
		});
	});

	fastify.get(`/ws/health`, { websocket: true }, (socket, req) => {
		socket.send(JSON.stringify({ type: 'health', payload: 'ok' }));
	});
	console.log('Websocket routes registered');
};

