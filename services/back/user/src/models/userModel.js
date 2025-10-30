
const db = require('./db');
function findAllUsers() {
  var res = db.prepare('SELECT * FROM users').all();
  console.log("-------\n" + res + "-----\n");
  return res;
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
  const info = stmt.run(...values);

  if (info.changes === 0)
    return null;

  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

module.exports = { findAllUsers,
                    findUserById,
                    updateUserById};
