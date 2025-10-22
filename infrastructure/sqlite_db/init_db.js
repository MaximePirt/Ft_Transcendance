const Database = require("better-sqlite3");

// Chemin vers le fichier de ta base SQLite
const db = new Database("./db.sqlite");

const createUsersTable = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  avatarUrl TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`;

const createFriendsTable = `
CREATE TABLE IF NOT EXISTS friends (
  id_user INTEGER,
  id_friend INTEGER,
  status TEXT CHECK( status IN ('pending','accepted','blocked') ) NOT NULL
);`;

try {
  db.exec(createUsersTable);
  console.log("Table 'users' created (or already exists).");
  db.exec(createFriendsTable);
  console.log("Table 'friends' created (or already exists).");
} catch (err) {
  console.error("Error creating users or friends table:", err);
}

db.close();
