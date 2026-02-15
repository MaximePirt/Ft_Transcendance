const db = require('./db');
const bcrypt = require('bcryptjs')

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
		return { error: "User already exist", ok: false };
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

function getUserId(rep, email, hashPass) {
	try {
		console.log("email: ", email, "hasPass: ", hashPass)
		const stmt = db.prepare(
			`SELECT * FROM users
					WHERE email = ?`
		).get(email);
		if (!stmt) {
			console.log("authModels: user not found")
			return rep.code(401).send({ error: 'Invalid credentials' })
		}
		console.log("user found from models !")
		const matchPass = bcrypt.compare(hashPass, stmt.password);
		if (!matchPass) {
			console.error("err: mismatch password")
			return rep.code(401).send({ error: 'Invalid credentials' })
		} else
			return stmt.id;
	} catch (e) {
		console.error(e);
		return rep.code(500).send({ error: 'Internal server error' });
	}
}

module.exports = {
	addNewUser,
	getUserName,
	getUserId,
};
