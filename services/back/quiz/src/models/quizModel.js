const db = require('./db');
const codeCreation = require('crypto');

function generateSessionCode()
{
	const res = codeCreation.randomBytes(3).toString('hex').toUpperCase();
	if (!res)
		throw new Error("Failed to generate session code");
	return res;
}

function insertGameSession(sessionCode, mode, topic, question_count, max_players, power_ups, is_solo, hostId)
{
	const insert = db.prepare(`
		INSERT INTO game_sessions (code, mode, topic, question_count, max_players, power_ups, is_solo, host_id)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`);
	const result = insert.run(sessionCode, mode, topic, question_count, max_players, power_ups, is_solo, hostId);
	if (result.changes !== 1)
		throw new Error("Failed to insert game session into database");
	return result;
}

function insertPlayerInGame(playerId, gameSessionId)
{
	const insertPlayer = db.prepare(`
		INSERT INTO game_players (game_session_id, user_id)
		VALUES (?, ?)
	`);
	const result = insertPlayer.run(gameSessionId, playerId);
	if (result.changes !== 1)
		throw new Error("Failed to insert player into game players");
	return result;
}

function getSessionById(sessionId)
{
	console.log("Model : Fetching game session by ID:", sessionId);
	const data = db.prepare(`
		SELECT id, code, mode, topic, question_count, max_players, host_id, status, started_at, ended_at,
			current_question_order, current_question_time, power_ups
		FROM game_sessions
		WHERE id = ?
	`).get(sessionId);
	return data;
}

function getSessionByCode(sessionCode)
{
	const data = db.prepare(`
		SELECT id, code, mode, topic, question_count, max_players, host_id, status, started_at, ended_at,
			current_question_order, current_question_time, power_ups		
		FROM game_sessions
		WHERE code = ?
	`).get(sessionCode);
	return data;
}

function getPlayersBySession(sessionId)
{
	const players = db.prepare(`
		SELECT u.id, u.username, gp.joined_at, gp.answered_count, gp.correct_answers, gp.score, gp.is_active
		FROM game_players gp
		JOIN users u ON gp.user_id = u.id
		WHERE gp.game_session_id = ? AND gp.is_active = 1
	`).all(sessionId);
	return players;
}

function updateSessionStatus(sessionId, newStatus)
{
	const res = db.prepare(`
		UPDATE game_sessions
		SET status = ?,
		started_at = CASE WHEN ? = 'in_progress' THEN CURRENT_TIMESTAMP ELSE started_at END,
		ended_at = CASE WHEN ? IN ('completed', 'abandoned') THEN CURRENT_TIMESTAMP ELSE ended_at END
		WHERE id = ?
	`).run(newStatus, newStatus, newStatus, sessionId);
	if (res.changes !== 1)
		throw new Error("Failed to update game session status");
	return res;
}

function updateWinnerForSession(sessionId) {
	const winner = db.prepare(`
		SELECT user_id
		FROM game_players
		WHERE game_session_id = ? AND is_active = 1
		ORDER BY score DESC, correct_answers DESC, answered_count ASC, joined_at ASC
		LIMIT 1
	`).get(sessionId);
	if (!winner)
		throw new Error("No active players found for game session to set winner");
	const res = db.prepare(`
		UPDATE game_players
		SET is_winner = 1
		WHERE game_session_id = ? AND user_id = ?
	`).run(sessionId, winner.user_id);
	if (res.changes !== 1)
		throw new Error("Failed to update winner for game session");
	return res;
}


function generateQuestionPool(mode, questionCount, topicJson)
{

	let query = `
		SELECT q.id, q.difficulty, q.type, q.category_id
		FROM questions q
		WHERE 1 = 1
		`;
	let params = [];
	if (mode !== 'random')
	{
		query += ` AND q.difficulty = ?`;
		params.push(mode);
	}
	else
		console.log("Random mode selected, no difficulty filter applied for question pool generation");

	if (topicJson && topicJson !== 'null') {
		try {
			const topics = JSON.parse(topicJson);
			if (Array.isArray(topics) && topics.length > 0) {
				const placeholders = topics.map(() => '?').join(',');
				query += ` AND q.category_id IN (
				SELECT id FROM categories WHERE slug IN (${placeholders})
			)`;
				params.push(...topics);
			}
			else
				console.log("No valid topics provided for question pool generation, skipping topic filter");
		}
		catch (err) {
			console.log("Failed to parse topic JSON:", err);
		}
	}
	else
		console.log("No topic filter applied for question pool generation");
	query += ` ORDER BY RANDOM() LIMIT ?`;
	params.push(questionCount);

	const questionPool = db.prepare(query).all(...params);

	
	return questionPool;
}

function insertPoolToSession(sessionId, questionPool)
{
	const insert = db.prepare(`
		INSERT INTO game_session_questions (game_session_id, question_id, question_order)
		VALUES (?, ?, ?)
	`);
	const insertMany = db.transaction((questions) => {
		for (let i = 0; i < questions.length; i++) {
			const q = questions[i];
			insert.run(sessionId, q.id, i + 1);
		}
	});
	insertMany(questionPool);
}
/**
 * @brief Check if a user is part of a game session
 * @param {*} sessionId 
 * @param {*} userId 
 * @returns user found in session or null if not found
 */
function findUserInSession(sessionId, userId)
{
	const player = db.prepare(`
		SELECT u.id, u.lang, u.username,
			gp.score, gp.answered_count, gp.correct_answers, gp.is_active
		FROM users u
		JOIN game_players gp ON gp.user_id = u.id
		WHERE game_session_id = ? AND user_id = ?
	`).get(sessionId, userId);
	const isInSession = !!player;
	if (!player)
		return null;
	return player;
}

/**
 * @brief Get the current question for a player in a game session, along with remaining time and game status
 * @param {*} sessionId 
 * @param {*} questionOrder 
 * @param {*} lang 
 * @returns 
 */
function getQuestionByOrderForPlayer(sessionId, questionOrder, lang) {
	const question = db.prepare(`
		SELECT
			gsq.question_order,
			q.id,
			q.type,
			qt.question_text,
			c.slug AS category_slug,
			ct.name AS category_name
		FROM game_session_questions gsq
		JOIN questions q ON gsq.question_id = q.id
		LEFT JOIN question_translations qt
			ON q.id = qt.question_id AND qt.lang = ?
		LEFT JOIN categories c ON q.category_id = c.id
		LEFT JOIN category_translations ct
			ON c.id = ct.category_id AND ct.lang = ?
		WHERE gsq.game_session_id = ?
			AND gsq.question_order = ?
		LIMIT 1
	`).get(lang, lang, sessionId, questionOrder);
	if (!question)
		return null;

	if (question.type === 'mcq') {
	question.options = db.prepare(`
		SELECT mo.position, mot.label
		FROM mcq_options mo
		JOIN mcq_option_translations mot
		ON mo.id = mot.option_id AND mot.lang = ?
		WHERE mo.question_id = ?
		ORDER BY mo.position
	`).all(lang, question.id);
	}

	question.total_questions = db.prepare(`
	SELECT COUNT(*) AS count
	FROM game_session_questions
	WHERE game_session_id = ?
	`).get(sessionId).count;

	return question;
}

function initSessionQuestionTimer(sessionId) {
	return db.prepare(`
		UPDATE game_sessions
		SET current_question_order = 1,
			current_question_time  = CURRENT_TIMESTAMP
		WHERE id = ?
	`).run(sessionId);
}

function getRemainingMs(sessionId, durationMs) {
	const row = db.prepare(`
		SELECT (unixepoch('now') - unixepoch(current_question_time)) AS elapsed_s
		FROM game_sessions
		WHERE id = ?
	`).get(sessionId);

	const elapsedMs = (row?.elapsed_s ?? 0) * 1000;
	return Math.max(0, durationMs - elapsedMs);
}

function normalizeAnswer(s) {
	return String(s ?? '')
		.trim()
		.toLocaleLowerCase()
		.normalize('NFD')  
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/['’`]/g, '')
		.replace(/[^a-z0-9\s-]/g, ' ')
		.replace(/\s+/g, ' ');
}

function checkAnswer(questionAnswer, answer)
{
	if (!questionAnswer)
		throw new Error("No correct answer data found for question ID: " + questionAnswer.id);

	if (questionAnswer.type === 'mcq') {
		const userAnswerNum = Number(answer);
		if (isNaN(userAnswerNum))
			return false;
		let isCorrect = userAnswerNum === questionAnswer.answer;
		return isCorrect;
	}

	if (questionAnswer.type === 'text') {
		const userAnswer = normalizeAnswer(answer);
		const normalizedCorrectAnswer = normalizeAnswer(questionAnswer.answer[0]);
		const variants = questionAnswer.answer.slice(1) || [];
		const variantsLower = variants.map(v => normalizeAnswer(v));

		const isCorrect = userAnswer === normalizedCorrectAnswer || variantsLower.includes(userAnswer);
		return isCorrect;
	}
}

function recordPlayerAnswer(sessionId, userId, questionId, answer, timeTaken, isCorrect)
{
	db.prepare(`
	INSERT INTO game_answers (game_session_id, user_id, question_id, answer_given, time_taken, is_correct)
	VALUES (?, ?, ?, ?, ?, ?)
	`).run(sessionId, userId, questionId, answer.toString(), timeTaken, isCorrect ? 1 : 0);
}

function updatePlayerScore(sessionId, userId, isCorrect, timeTaken){
	const scoreIncrement = isCorrect ? 100 | 0 : 0;
	db.prepare(`
	UPDATE game_players 
	SET score = score + ?, 
	correct_answers = correct_answers + ?, 
	answered_count = answered_count + 1
	WHERE game_session_id = ? AND user_id = ?
	`).run(scoreIncrement, isCorrect ? 1 : 0, sessionId, userId);
}

function getCorrectAnswerForQuestion(questionId, lang)
{
	const question = db.prepare(`
	SELECT q.type, mcq.correct_option_position,
		tat.answer AS text_answer,
		tat.variants_json AS text_answer_variants_parsed
	FROM questions q
	LEFT JOIN mcq_questions mcq ON mcq.question_id = q.id
	LEFT JOIN text_answer_translations tat
		ON tat.question_id = q.id AND tat.lang = ?
	WHERE q.id = ?
	`).get(lang, questionId);
	if (!question)
		return null;
	if (question.type === 'text') {
		let variants = [];
		try {
			variants = JSON.parse(question.text_answer_variants_parsed);
		} catch (err) {
			console.log("Failed to parse text answer variants JSON for question ID:", questionId, "Error:", err);
			return null;
		}
		return {
			type: 'text',
			answer: [question.text_answer, ...variants].filter(Boolean)
		};
	}
	if (question.type === 'mcq') {
		const options = db.prepare(`
		SELECT correct_option_position
		FROM mcq_questions
		WHERE question_id = ?
		`).get(questionId);
		return options ? { type: 'mcq', answer: options.correct_option_position } : null;
	}
	return null;
}

function getPlayerAnswerForQuestion(sessionId, userId, questionId)
{
	const result = db.prepare(`
		SELECT answer_given
		FROM game_answers 
		WHERE game_session_id = ? AND user_id = ? AND question_id = ?
	`).get(sessionId, userId, questionId);

	return result;
}


function getCurrentQuestionId(sessionId) {
	const session = getSessionById(sessionId);
	if (!session || !session.current_question_order)
		return null;

	const row = db.prepare(`
		SELECT question_id
		FROM game_session_questions
		WHERE game_session_id = ? AND question_order = ?
	`).get(sessionId, session.current_question_order);
	return row?.question_id ?? null;
}

function getTimeTakenFromSession(sessionId) {
	const row = db.prepare(`
		SELECT (unixepoch('now') - unixepoch(current_question_time)) AS elapsed_s
		FROM game_sessions
		WHERE id = ?
	`).get(sessionId);

	return Math.max(0, Math.round(row?.elapsed_s ?? 0));
}

function haveAllPlayersAnswered(sessionId, questionId) {
	const playersCount = db.prepare(`
		SELECT COUNT(*) AS c
		FROM game_players
		WHERE game_session_id = ? AND is_active = 1
	`).get(sessionId).c;

	const answersCount = db.prepare(`
		SELECT COUNT(*) AS c
		FROM game_answers ga
		JOIN game_players gp ON gp.user_id = ga.user_id AND gp.game_session_id = ga.game_session_id
		WHERE ga.game_session_id = ? AND ga.question_id = ? AND gp.is_active = 1
	`).get(sessionId, questionId).c;
	return answersCount >= playersCount;
}

function advanceSession(sessionId) {
	const session = getSessionById(sessionId);

	if (!session)
		return { status: 'abandoned' };

	if (session.current_question_order >= session.question_count) {
		updateWinnerForSession(sessionId);
		updateSessionStatus(sessionId, 'completed');
		return { status: 'completed' };
	}

	db.prepare(`
		UPDATE game_sessions
		SET current_question_order = current_question_order + 1,
			current_question_time  = CURRENT_TIMESTAMP
		WHERE id = ?
	`).run(sessionId);

	const new_order = db.prepare(`
		SELECT current_question_order
		FROM game_sessions
		WHERE id = ? `).get(sessionId).current_question_order;

	return { status: 'in_progress' , new_order: new_order};
}


function getPlayerName(userId) {
	const res = db.prepare(`SELECT username FROM users WHERE id = ? `).get(userId);
	return res?.username ?? 'Unknown Player';
}


function removePlayerFromSession(sessionId, userId) {
	const res = db.prepare(`
		DELETE FROM game_players
		WHERE game_session_id = ? AND user_id = ?`).run(sessionId, userId);
	if (res.changes !== 1)
		throw new Error("Failed to remove player from game session");
}


function setPlayerActive(sessionId, userId, active) {
	return db.prepare(`
		UPDATE game_players
		SET is_active = ?, disconnected_at = CASE WHEN ? = 0 THEN CURRENT_TIMESTAMP ELSE NULL END
		WHERE game_session_id = ? AND user_id = ?
	`).run(active ? 1 : 0, active ? 1 : 0, sessionId, userId);
}

function getNextActivePlayer(sessionId, excludeUserId) {
	return db.prepare(`
		SELECT user_id
		FROM game_players
		WHERE game_session_id = ?
			AND is_active = 1
			AND user_id != ?
		ORDER BY joined_at ASC
		LIMIT 1
	`).get(sessionId, excludeUserId);
}

function transferHost(sessionId, newHostId) {
	return db.prepare(`
		UPDATE game_sessions SET host_id = ?
		WHERE id = ?
	`).run(newHostId, sessionId);
}

function getLeaderboardForSession(sessionId) {
	const leaderboard = db.prepare(`
		SELECT u.id, u.username, gp.score, gp.correct_answers, gp.answered_count, gp.is_active, gp.joined_at
		FROM game_players gp
		JOIN users u ON gp.user_id = u.id
		WHERE gp.game_session_id = ?
		ORDER BY gp.score DESC, gp.correct_answers DESC, gp.joined_at ASC, gp.user_id ASC
	`).all(sessionId);
	return leaderboard;
}

function countPowerups(sessionId, userId) {
	console.log("Model: Counting powerups for user ID:", userId, "in game session ID:", sessionId);
	const row = db.prepare(`
		SELECT powerups_count
		FROM game_players
		WHERE game_session_id = ? AND user_id = ?
	`).get(sessionId, userId);
	console.log("User Id : ", userId, "has powerups count:", row?.powerups_count ?? 0);
	return row?.powerups_count ?? 0;
}

function grantPowerup(sessionId, userId, questionOrder, powerupType) {
	console.log("Model : Granting power up ", powerupType, " to userId :", userId);
	
	db.prepare(`
		INSERT INTO game_powerups (game_session_id, user_id, question_order, powerup_type)
		VALUES (?, ?, ?, ?)
	`).run(sessionId, userId, questionOrder, powerupType);

	const increment = db.prepare(`
		UPDATE game_players
		SET powerups_count = powerups_count + 1
		WHERE game_session_id = ? AND user_id = ?
	`).run(sessionId, userId);
	return increment;
}

function getAvailablePowerupsForPlayer(sessionId, userId) {
	const res = db.prepare(`
		SELECT id, powerup_type, question_order, granted_at
		FROM game_powerups
		WHERE game_session_id = ?
			AND user_id = ?
			AND used = 0
		ORDER BY granted_at ASC
	`).all(sessionId, userId);
	console.log("User :", userId, "has available powerups: [", res.map(p => p.powerup_type).join(", "), "]");
	return res;
}

function usePowerup(powerupId, userId, sessionId) {
	console.log("Model: Using powerup ID:", powerupId, "for user ID:", userId, "in game session ID:", sessionId);
	const result = db.prepare(`
		UPDATE game_powerups
		SET used = 1, used_at = CURRENT_TIMESTAMP
		WHERE powerup_type = ? AND user_id = ? AND used = 0
	`).run(powerupId, userId);

	if (result.changes > 0) {
		const powerup = db.prepare(`SELECT game_session_id FROM game_powerups WHERE id = ?`).get(powerupId);
		db.prepare(`
			UPDATE game_players
			SET powerups_count = powerups_count - 1
			WHERE game_session_id = ? AND user_id = ? AND powerups_count > 0
		`).run(sessionId, userId);
	}
	return result.changes > 0;
}

function printSessionQuestions(sessionId) {
	const questions = db.prepare(`
		SELECT gsq.question_order, q.id AS question_id, q.difficulty, q.type, c.slug AS category_slug
		FROM game_session_questions gsq
		JOIN questions q ON gsq.question_id = q.id
		LEFT JOIN categories c ON q.category_id = c.id
		WHERE gsq.game_session_id = ?
		ORDER BY gsq.question_order ASC
	`).all(sessionId);
	return questions;
}

module.exports = {
	generateSessionCode,
	insertGameSession,
	insertPlayerInGame,
	getSessionById,
	getSessionByCode,
	getPlayersBySession,
	updateSessionStatus,
	updateWinnerForSession,
	generateQuestionPool,
	insertPoolToSession,
	findUserInSession,
	checkAnswer,
	recordPlayerAnswer,
	updatePlayerScore,
	getCorrectAnswerForQuestion,
	getPlayerAnswerForQuestion,
	getQuestionByOrderForPlayer,
	initSessionQuestionTimer,
	getCurrentQuestionId,
	getRemainingMs,
	haveAllPlayersAnswered,
	advanceSession,
	getTimeTakenFromSession,
	getPlayerName,
	removePlayerFromSession,
	setPlayerActive,
	getNextActivePlayer,
	transferHost,
	getLeaderboardForSession,
	grantPowerup,
	getAvailablePowerupsForPlayer,
	usePowerup,
	countPowerups,
	printSessionQuestions
};