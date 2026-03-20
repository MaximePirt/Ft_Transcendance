import db from './db.js'
import bcrypt from 'bcryptjs';

function addNewUser(username, email, password) {
	const validateEmail = (email) => {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
	}
	if (!username || !email || !password)
		throw new Error("MISSING_FIELDS");
	else if (!validateEmail(email))
		throw new Error("INVALID_CREDENTIALS");

	const existingByEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
	if (existingByEmail)
		throw new Error('EMAIL_EXISTS');

	const existingByUsername = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
	if (existingByUsername)
		throw new Error('USERNAME_TAKEN');

	let stmt;
	try {
		stmt = db.prepare(
			"INSERT INTO users(username, email, password) VALUES (?, ?, ?)"
		).run(username, email, password);
	} catch (err) {
		const sqliteCode = String(err?.code || '');
		const errorMsg = String(err?.message || err || '');
		const lowerMsg = errorMsg.toLowerCase();

		const isUniqueConstraint =
			sqliteCode.includes('SQLITE_CONSTRAINT') ||
			lowerMsg.includes('unique constraint failed') ||
			lowerMsg.includes('constraint failed');

		if (isUniqueConstraint && lowerMsg.includes('users.email')) {
			throw new Error('EMAIL_EXISTS');
		}
		if (isUniqueConstraint && lowerMsg.includes('users.username')) {
			throw new Error('USERNAME_TAKEN');
		}
		if (isUniqueConstraint) {
			throw new Error('DATABASE_ERROR');
		}
		if (lowerMsg.includes('readonly') || lowerMsg.includes('attempt to write a readonly database')) {
			throw new Error('DATABASE_READ_ONLY');
		}
		if (lowerMsg.includes('database is locked') || lowerMsg.includes('database is busy')) {
			throw new Error('DATABASE_BUSY');
		}
		throw err;
	}

	console.log("Data successfully sent in database !");
	return Number(stmt.lastInsertRowid);
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

function getSignupAvailability(email, username) {
	const existingByEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
	const existingByUsername = db.prepare('SELECT id FROM users WHERE username = ?').get(username);

	return {
		emailAvailable: !existingByEmail,
		usernameAvailable: !existingByUsername,
	};
}

async function getUserId(email, password) {
	const stmt = db.prepare(
		`SELECT * FROM users
					WHERE email = ?`
	).get(email);
	if (!stmt) {
		throw new Error("USER_NOT_FOUND");
	}

	const matchPass = await bcrypt.compare(password, stmt.password);
	delete stmt.password;
	if (!matchPass) {
		throw new Error("USER_NOT_FOUND");
	} else
		return stmt;
}

export {
	addNewUser,
	getUserName,
	getUserId,
	getUserModelEmail,
	getSignupAvailability
};
