//TODO: ADD a table check to only create tables which haven't been created

const Database = require("better-sqlite3");
const fs = require("fs");

const dbPath = process.env.DB_PATH || false;
if (!dbPath) {
  console.error("Error: DB_PATH environment variable is not set.");
  process.exit(1);
}

console.log(`[user-db] Database path: ${dbPath}`);

console.log("=== DEBUG: Initializing database ===");

if (fs.existsSync(dbPath)) {
  console.log("Database already exists. Skipping initialization.");
  process.exit(0);
}

const db = new Database(dbPath);

db.pragma("foreign_keys = ON");


const createUsersTable = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  avatarUrl TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  lastConnexion DATETIME DEFAULT CURRENT_TIMESTAMP,
  onlineStatus BOOLEAN NOT NULL DEFAULT 0
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
  CHECK (user_id < friend_id),
  CHECK (initiator_id IN (user_id, friend_id))
);`;


try {
  console.log("Creating tables...");
  db.exec(createUsersTable);
  console.log("Table 'users' created (or already exists).");
  db.exec(createFriendsTable);
  console.log("Table 'friends' created (or already exists).");
} catch (err) {
  console.error("Error creating users or friends table:", err);
  process.exit(1);
}

const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table'")
  .all();
console.log("Tables created:", tables);

console.log("Create fake data...");
const insertUser = db.prepare(
  "INSERT INTO users (username, email, password, avatarUrl) VALUES (?, ?, ?, ?)"
);
// TODO: Remove theses fakes data in prod
const users = [
  [
    "alice",
    "alice@example.com",
    "password123",
    "https://example.com/avatars/alice.png",
  ],
  [
    "bob",
    "bob@example.com",
    "password456",
    "https://example.com/avatars/bob.png",
  ],
  [
    "charlie",
    "charlie@example.com",
    "password789",
    "https://example.com/avatars/charlie.png",
  ],
];

for (const user of users) {
  insertUser.run(...user);
}
////////

db.close();
console.log("Database initialized successfully!");
