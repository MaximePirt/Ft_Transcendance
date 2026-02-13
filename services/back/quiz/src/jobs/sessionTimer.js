const QUESTION_TIMER = Number(process.env.QUESTION_TIMER || 15000);
const SESSION_TIMERS = new Map();

function clearTimer(sessionId) {
	const time = SESSION_TIMERS.get(sessionId);
	if (time) clearTimeout(time);
	SESSION_TIMERS.delete(sessionId);
}

function scheduleTimer(sessionId, onExpire) {
	if (typeof onExpire !== 'function')
		throw new TypeError('scheduleTimer(sessionId, onExpire): onExpire must be a function');
	clearTimer(sessionId);
	const timer = setTimeout(() => onExpire(sessionId), QUESTION_TIMER);
	SESSION_TIMERS.set(sessionId, timer);
}

module.exports = { QUESTION_TIMER, clearTimer, scheduleTimer };