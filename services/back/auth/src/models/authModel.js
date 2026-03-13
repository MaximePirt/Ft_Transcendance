import db from './db.js'
import bcrypt from 'bcryptjs';

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

function checkUserModel(email, username) {
	try {
		const stmt = db.prepare(
			"SELECT email, username, password FROM users WHERE email = ? OR username = ?"
		).get(email, username);
		if (stmt) throw new Error();
	} catch (e) {
		return "EMAIL_EXISTS";
	}
}

function changeUserModelAuth(email, value) {
	try {
		db.prepare(
			'UPDATE users SET isAuth = ? WHERE email = ?'
		).run(value, email);
	} catch (e) {
		console.error(e);
		return "DEFAULT";
	}
}

async function getModelUserId(email, password) {
	try {
		const stmt = db.prepare(
			"SELECT id, password FROM users WHERE email = ?"
		).get(email);

		const isMatch = await bcrypt.compare(password, stmt.password);

		if (!isMatch)
			return "USER_NOT_FOUND";
		return stmt.id;
	} catch (e) {
		return "USER_NOT_FOUND";
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
		return "DEFAULT";
	console.log(stmt.isAuth);
	return stmt.isAuth;
}

export {
	addNewUser,
	getUserName,
	getUserModelEmail,
	getModelUserId,
	getUserModelAuth,
	changeUserModelAuth,
	checkUserModel
};
