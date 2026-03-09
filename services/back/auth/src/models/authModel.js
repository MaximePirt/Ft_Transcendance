import db from './db.js'

function addNewUser(username, email, password) {
	try {
		const stmt = db.prepare(
			"INSERT INTO users(username, email, password) VALUES (?, ?, ?)"
		).run(username, email, password);
		console.log("Data successfully sent in database !");
		return stmt.lastInsertRowid;
	} catch (e) {
		console.error("constraint unique: ", e);
		if (e.code === "SQLITE_CONSTRAINT_UNIQUE") {
			return "EMAIL_EXISTS";
		} else {
			return "DEFAULT";
		}
	}
}

function getModelUserId(email) {
	try {
		const stmt = db.prepare(
			"SELECT id FROM users WHERE email = ?"
		).get(email);
		return stmt.id;
	} catch (e) {
		console.error(e);
		return "DEFAULT";
	}
}

function getUserName(email) {
	const stmt = db.prepare(
		`SELECT username FROM users
			WHERE email = ?`
	).get(email);
	if (!stmt)
		return "INVALID_CREDENTIALS";
	return stmt.username;
}

function getUserModelEmail(email) {
	const stmt = db.prepare(
		`SELECT * FROM users WHERE email = ?`
	).get(email);
	if (!stmt)
		return "USER_NOT_FOUND";
	return stmt;
}

function getUserModelAuth(email) {
	const stmt = db.prepare(
		`SELECT isAuth from users WHERE email = ?`
	).get(email);
	if (!stmt)
		return "USER_NOT_FOUND";
	console.log(stmt.isAuth);
	return stmt.isAuth;
}

export {
	addNewUser,
	getUserName,
	getUserModelEmail,
	getModelUserId,
	getUserModelAuth
};
