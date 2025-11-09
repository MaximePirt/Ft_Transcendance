const Database = require("better-sqlite3");

// DB paths
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
  user_id INTEGER NOT NULL,
  friend_id INTEGER NOT NULL,
  status TEXT CHECK( status IN ('pending','accepted','blocked') ) NOT NULL DEFAULT 'pending',
  initiator_id INTEGER NOT NULL,
  PRIMARY KEY (user_id, friend_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (initiator_id) REFERENCES users(id) ON DELETE CASCADE,
  CHECK (user_id < friend_id)
  CHECK (initiator_id IN (user_id, friend_id))
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
