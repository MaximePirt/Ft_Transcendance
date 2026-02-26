import db from './db.js'
import bcrypt from 'bcryptjs';

function addNewUser(data) {
	try {
		const stmt = db.prepare(
			"INSERT INTO users(username, email, password) VALUES (?, ?, ?)"
		);
		const info = stmt.run(data.username, data.email, data.password);
		console.log("Data successfully sent in database !");
		console.log("user id: ", info.lastInsertRowid);
		return info.lastInsertRowid;
	} catch (err) {
		console.error(err);
		if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
			return { ok: false, error: "Username or Email already exists" };
		}
		return { ok: false, error: "Database error occurred" };
	}
}

function getUserName(req, rep) {
	try {
		const stmt = db.prepare(
			`SELECT username FROM users
			WHERE email = ?`
		).get(req.body.email);
		if (!stmt)
			return rep.code(400).send({ error: 'Credentials error' })
		return stmt.username;
	} catch (e) {
		console.error(e);
		return rep.code(500).send({ error: 'Internal server error' })
	}
}

function getUserModelEmail(email) {
	const stmt = db.prepare(
		`SELECT user FROM users WHERE email = ?`
	).get(email);
	if (!stmt)
		throw new Error("USER_NOT_FOUND");
	return stmt;
}

function getUserId(email, password) {
	try {
		const stmt = db.prepare(
			`SELECT * FROM users
					WHERE email = ?`
		).get(email);
		if (!stmt) {
			console.log("authModels: user not found")
			return { ok: false, error: "user not found" }
		}
		const matchPass = bcrypt.compare(password, stmt.password);
		if (!matchPass) {
			console.error("err: mismatch password")
			return { ok: false, error: "bad password" }
		} else
			return stmt.id;
	} catch (e) {
		console.error(e);
		return { code: 500, error: "Internal server error" }
	}
}

export {
	addNewUser,
	getUserName,
	getUserId,
	getUserModelEmail
};
