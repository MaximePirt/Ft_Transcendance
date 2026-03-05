import db from './db.js'
import bcrypt from 'bcryptjs';

function addNewUser(username, email, password) {
	const validateEmail = (email) => {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
	}
	const stmt = db.prepare(
		"INSERT INTO users(username, email, password) VALUES (?, ?, ?)"
	).run(username, email, password);
	if (!email && !password)
		throw new Error("MISSING_FIELDS");
	else if (!validateEmail)
		throw new Error("INVALID_CREDENTIALS");
	console.log("Data successfully sent in database !");
	return stmt.lastInsertRowid;
}

function getUserName(email) {
	const stmt = db.prepare(
		`SELECT username FROM users
			WHERE email = ?`
	).get(email);
	if (!stmt)
		throw new Error("INVALID_CREDENTIALS");
	return stmt.username;
}

function getUserModelEmail(email) {
	const stmt = db.prepare(
		`SELECT * FROM users WHERE email = ?`
	).get(email);
	if (!stmt)
		throw new Error("USER_NOT_FOUND");
	return stmt;
}

async function getUserId(email, password) {
	const stmt = db.prepare(
		`SELECT * FROM users
					WHERE email = ?`
	).get(email);
	if (!stmt) {
		console.log("here")
		throw new Error("USER_NOT_FOUND");
	}

	const matchPass = await bcrypt.compare(password, stmt.password);
	delete stmt.password;
	if (!matchPass) {
		console.log("no, here");
		throw new Error("USER_NOT_FOUND");
	} else
		return stmt;
}

export {
	addNewUser,
	getUserName,
	getUserId,
	getUserModelEmail
};
