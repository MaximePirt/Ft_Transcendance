const Database = require("better-sqlite3");

const db = new Database(process.env.DB_PATH), verbose = console.log;
if (db === null) {
  throw new Error("Failed to connect to the quiz database.");
}
db.pragma('foreign_keys = ON');

module.exports = db;

