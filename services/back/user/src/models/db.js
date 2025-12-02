const Database = require("better-sqlite3");

const db = new Database("/db/db.sqlite"), verbose = console.log;
if (db === null) {
  throw new Error("Failed to connect to the database.");
}
db.pragma('foreign_keys = ON');


// Vérifie les tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log("Available tables:", tables);

module.exports = db;

