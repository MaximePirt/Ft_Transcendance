
const db = require('./db');
function findAllUsers() {
  var res = db.prepare('SELECT * FROM users').all();
  console.log("-------\n" + res + "-----\n");
  return res;
}

function addNewUser(data) {
  try {
    db.prepare(
      "INSERT INTO users(username, email, password) VALUES (?, ?, ?)"
    ).run(data.username, data.email, data.password);
  } catch (e) {
    console.error(e);
  }
}

function findUserById(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

function updateUserById(id, data) {
  const fields = Object.keys(data);
  if (fields.length === 0)
    return null;

  const setClause = fields.map(field => `${field} = ?`).join(', ');
  const values = fields.map(field => data[field]);
  values.push(id);

  const stmt = db.prepare(`UPDATE users SET ${setClause} WHERE id = ?`);
  
  let info;
  try {
    info = stmt.run(...values);
  }
  catch (err)
  {
    const errorMsg = String(err);

    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' &&  errorMsg.includes('users.email'))
      throw new Error('Email already taken by another account');
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' &&  errorMsg.includes('users.username'))
      throw new Error('Username already taken by another account');

    throw err;
  }
  if (info.changes === 0)
    return null;
  
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

module.exports = { findAllUsers,
                    findUserById,
                    updateUserById,
                    addNewUser };
