const db = require('../models/db');
const quizModel = require('../models/quizModel');
const sessionTimer = require('./sessionTimer');
const wsHub = require('../ws/wsHub');


function expireCurrentQuestion(sessionId) {
	const session = quizModel.getSessionById(sessionId);
	if (!session || session.status !== 'in_progress') return;

	const questionId = quizModel.getCurrentQuestionId(sessionId);
	if (!questionId) return;

	const missing = db.prepare(`
		SELECT gp.user_id
		FROM game_players gp
		WHERE gp.game_session_id = ?
			AND gp.is_active = 1
			AND NOT EXISTS (
			SELECT 1 FROM game_answers ga
			WHERE ga.game_session_id = gp.game_session_id
				AND ga.user_id = gp.user_id
				AND ga.question_id = ?
			)
	`).all(sessionId, questionId);

	const insertTimeout = db.prepare(`
		INSERT OR IGNORE INTO game_answers
			(game_session_id, user_id, question_id, answer_given, is_correct, time_taken)
		VALUES (?, ?, ?, 'timeout', 0,
			(SELECT (unixepoch('now') - unixepoch(current_question_time))
			FROM game_sessions WHERE id = ?)
	)
	`);

	const bumpAnsweredCount = db.prepare(`
		UPDATE game_players
		SET answered_count = answered_count + 1
		WHERE game_session_id = ? AND user_id = ?
	`);

	const tx = db.transaction(() => {
	for (const row of missing) {
		insertTimeout.run(sessionId, row.user_id, questionId, sessionId);
		bumpAnsweredCount.run(sessionId, row.user_id);
	}
	});

	tx();

	const { status } = quizModel.advanceSession(sessionId);
	const players = quizModel.getPlayersBySession(sessionId);

	if (status === 'in_progress')
	{
		wsHub.broadcast(sessionId, { type: 'next_question', payload: { sessionId } });
		sessionTimer.scheduleTimer(sessionId, expireCurrentQuestion);
	}
	else if (status === 'completed')
		wsHub.broadcast(sessionId, {type: 'session_completed', payload: {sessionId}});
	wsHub.broadcast(sessionId, { type: 'scoreboard_updated', payload: { sessionId, players } });

}

module.exports = { expireCurrentQuestion };
