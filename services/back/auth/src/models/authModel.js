const db = require('./db');

function addNewUser(data) {
	try {
		db.prepare(
			"INSERT INTO users(username, email, password) VALUES (?, ?, ?)"
		).run(data.username, data.email, data.password);
		console.log("Data successfully sent in database !");
	} catch (err) {
		console.error(err, "toto");
		return {error: "User already exist", ok:false};
	}
	return { ok:true, message: "User added successfully" };
}




module.exports = {
	addNewUser,
};