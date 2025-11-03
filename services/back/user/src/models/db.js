const Database = require("better-sqlite3");
const db = new Database("/app/db.sqlite"), verbose = console.log;
if (db === null) {
  throw new Error("Failed to connect to the database.");
}
module.exports = db;

