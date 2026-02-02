const db = require('./db');

// SQL commands
const getSubjectQuestions = db.prepare(`
	SELECT * FROM questions
	WHERE subject = ?
`);

export {db};