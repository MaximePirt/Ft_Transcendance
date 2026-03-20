import Database from "better-sqlite3";

const db = new Database("/db/db.sqlite");
if (db === null) {
	throw new Error("Failed to connect to the database.");
}
db.pragma('foreign_keys = ON');

export default db;

