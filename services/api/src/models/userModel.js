
const db = require('./db');
function findAllUsers() {
	// return [
  //     { id: 1, username: "Alice" },
  //     { id: 2, username: "Bob" },
  //   ];
  var res = db.prepare('SELECT * FROM users').all();
  console.log("-------\n" + res + "-----\n");
  return res;
}

function findUserById(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

module.exports = { findAllUsers, findUserById };
