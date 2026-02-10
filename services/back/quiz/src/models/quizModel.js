const db = require('./db');
const codeCreation = require('crypto');

function generateSessionCode()
{
	const res = codeCreation.randomBytes(3).toString('hex').toUpperCase();
	if (!res)
		throw new Error("Failed to generate session code");
	return res;
}

function insertGameSession(sessionCode, mode, topic, question_count, max_players, hostId)
{
	const insert = db.prepare(`
		INSERT INTO game_sessions (code, mode, topic, question_count, max_players, host_id)
		VALUES (?, ?, ?, ?, ?, ?)
	`);
	const result = insert.run(sessionCode, mode, topic, question_count, max_players, hostId);
	if (result.changes !== 1)
		throw new Error("Failed to insert game session into database");
	return result;
}

function insertPlayerInGame(playerId, gameSessionId)
{
	console.log("Inserting player ID:", playerId, "into game session ID:", gameSessionId);
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
		SELECT id, code, mode, topic, question_count, max_players, host_id, status, started_at, ended_at
		FROM game_sessions
		WHERE id = ?
	`).get(sessionId);
	console.log("Game session data retrieved:", data);
	return data;
}

function getSessionByCode(sessionCode)
{
	console.log("Model : Fetching game session by code:", sessionCode);
	const data = db.prepare(`
		SELECT id, code, mode, topic, question_count, max_players, host_id, status, started_at, ended_at
		FROM game_sessions
		WHERE code = ?
	`).get(sessionCode);
	console.log("Game session data retrieved:", data);
	return data;
}

function getPlayersBySession(sessionId)
{
	console.log("Model : Fetching all players for game session ID:", sessionId);
	const players = db.prepare(`
		SELECT u.id, u.username, gp.joined_at, gp.answered_count, gp.correct_answers, gp.score
		FROM game_players gp
		JOIN users u ON gp.user_id = u.id
		WHERE gp.game_session_id = ?
	`).all(sessionId);
	console.log("Players retrieved for session ID", sessionId, ":", players);
	return players;
}

function updateSessionStatus(sessionId, newStatus)
{
	console.log("Model: Updating status of game session ID:", sessionId, "to:", newStatus);
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


function generateQuestionPool(mode, questionCount, topicJson)
{
	console.log("Model: Generating question pool with mode:", mode, "question count:", questionCount, "topic:", topicJson);
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
			console.log("Parsed topic JSON for question pool generation:", topics);
			if (Array.isArray(topics) && topics.length > 0) {
				const placeholders = topics.map(() => '?').join(',');
				console.log("Applying topic filter for question pool generation with topics:", topics);
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
	console.log("Generated question pool:", questionPool);

	
	return questionPool;
}

function insertPoolToSession(sessionId, questionPool)
{
	console.log("Model: Inserting question pool into game session ID:", sessionId);
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
	console.log("Inserted", questionPool.length, "questions into game session ID:", sessionId);
}
/**
 * @brief Check if a user is part of a game session
 * @param {*} sessionId 
 * @param {*} userId 
 * @returns user found in session or null if not found
 */
function findUserInSession(sessionId, userId)
{
	console.log("Model: Checking if user ID:", userId, "is in game session ID:", sessionId);
	const player = db.prepare(`
		SELECT u.id, u.lang
		FROM users u
		JOIN game_players gp ON u.id = gp.user_id
		WHERE game_session_id = ? AND user_id = ?
	`).get(sessionId, userId);
	const isInSession = !!player;
	console.log("Is user ID:", userId, "in game session ID:", sessionId, "?", isInSession);
	console.log("Player record found:", player);
	if (!player)
		return null;
	return player;
}

/**
 * @brief Get the current question for a player in a game session based on the number of questions they have already answered
 * 			and base on their language preference
 * @param {*} sessionId 
 * @param {*} player 
 * @returns next question if success, null if no more question or error
 */
function getCurrentQuestionForPlayer(sessionId, player)
{
	console.log("Model: Fetching current question for user ID:", player.id, "in game session ID:", sessionId);
	const question = db.prepare(`
	SELECT 
		gsq.question_order,
		q.id,
		q.type,
		qt.question_text,
		c.slug as category_slug,
		ct.name as category_name
	FROM game_session_questions gsq
	JOIN questions q ON gsq.question_id = q.id
	LEFT JOIN question_translations qt 
		ON q.id = qt.question_id AND qt.lang = ?
	LEFT JOIN categories c ON q.category_id = c.id
	LEFT JOIN category_translations ct 
		ON c.id = ct.category_id AND ct.lang = ?
	WHERE gsq.game_session_id = ?
		AND NOT EXISTS (
		SELECT 1 FROM game_answers 
		WHERE game_session_id = ? 
			AND user_id = ? 
			AND question_id = q.id
		)
	ORDER BY gsq.question_order
	LIMIT 1
	`).get(player.lang, player.lang, sessionId, sessionId, player.id);
	if (!question)
		return null;

	if (question.type === 'mcq') {
		const options = db.prepare(`
		SELECT 
		mo.position,
		mot.label
		FROM mcq_options mo
		JOIN mcq_option_translations mot 
		ON mo.id = mot.option_id AND mot.lang = ?
		WHERE mo.question_id = ?
		ORDER BY mo.position
		`).all(player.lang, question.id);
		question.options = options;
	}

	const total = db.prepare(`
		SELECT COUNT(*) as count 
		FROM game_session_questions 
		WHERE game_session_id = ?
		`).get(sessionId);

	question.total_questions = total.count;
	console.log("Current question retrieved for user ID:", player.id, "in game session ID:", sessionId, ":", question);
	return question;
}

function recordQuestionTimer(sessionId, userId, questionId) {
	db.prepare(`
	UPDATE game_players 
	SET current_question_time = CURRENT_TIMESTAMP
	WHERE game_session_id = ? AND user_id = ?
	`).run(sessionId, userId);

	console.log("Question", questionId, "sent to user", userId, "at", new Date().toISOString());
}

function getAnswerTime(sessionId, userId, questionId) {
	console.log("Model: Calculating time taken for user", userId);

	const result = db.prepare(`
		SELECT 
			current_question_time,
			(julianday('now') - julianday(current_question_time)) * 86400 as time_taken_seconds
		FROM game_players
		WHERE game_session_id = ? AND user_id = ?
	`).get(sessionId, userId);

	if (!result || !result.current_question_time) {
		console.log("No timestamp found, returning 0");
		return 0;
	}

	const timeTaken = Math.round(result.time_taken_seconds);
	console.log("Time taken:", timeTaken, "seconds");
	return timeTaken;
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
	console.log("Model: Checking Answer");
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
		console.log("Validating TEXT answer. User answer:", answer, "- Correct answer:", questionAnswer.answer, "- Variants:", questionAnswer.answer);
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

	console.log("Recorded answer for user ID:", userId, "question ID:", questionId, "in game session ID:", sessionId, "Answer:", answer, "Time taken:", timeTaken, "Correct:", isCorrect);
}

function updatePlayerScore(sessionId, userId, isCorrect, timeTaken){
	const scoreIncrement = isCorrect ? 100 | 0 : 0; // Base points for a correct answer
	db.prepare(`
	UPDATE game_players 
	SET score = score + ?, 
	correct_answers = correct_answers + ?, 
	answered_count = answered_count + 1
	WHERE game_session_id = ? AND user_id = ?
	`).run(scoreIncrement, isCorrect ? 1 : 0, sessionId, userId);
	
	console.log("Updated score for user ID:", userId, "in game session ID:", sessionId, "Score increment:", scoreIncrement, "Time taken:", timeTaken);
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

module.exports = {
	generateSessionCode,
	insertGameSession,
	insertPlayerInGame,
	getSessionById,
	getSessionByCode,
	getPlayersBySession,
	updateSessionStatus,
	generateQuestionPool,
	insertPoolToSession,
	findUserInSession,
	getCurrentQuestionForPlayer,
	recordQuestionTimer,
	getAnswerTime,
	checkAnswer,
	recordPlayerAnswer,
	updatePlayerScore,
	getCorrectAnswerForQuestion,
	getPlayerAnswerForQuestion
};