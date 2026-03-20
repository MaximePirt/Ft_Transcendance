const Database = require("better-sqlite3");

const dbPath = process.env.DB_PATH || false;
if (!dbPath) {
  console.error("Error: DB_PATH environment variable is not set.");
  process.exit(1);
}

console.log(`[user-db] Database path: ${dbPath}`);

console.log("=== DEBUG: Initializing database ===");


const db = new Database(dbPath);
db.pragma("foreign_keys = ON");


const createUsersTable = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  avatarUrl TEXT DEFAULT '/avatar/Default.png',
  lang TEXT DEFAULT 'en',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  lastConnexion DATETIME DEFAULT CURRENT_TIMESTAMP,
  onlineStatus BOOLEAN NOT NULL DEFAULT 0,
  profileCardBgColor TEXT DEFAULT '#0f0f10',
  profileCardStickers TEXT DEFAULT '[]',
  profileCardTitles TEXT DEFAULT '["cinema","quiz_master"]',
  profileCardDescription TEXT DEFAULT '',
  theme TEXT DEFAULT 'default',
  font TEXT DEFAULT 'default'
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

const ensureUserColumn = (name, definition, defaultValue) => {
  const columns = db.prepare("PRAGMA table_info(users)").all();
  const exists = columns.some((col) => col.name === name);
  if (!exists) {
    db.exec(`ALTER TABLE users ADD COLUMN ${name} ${definition}`);
    if (defaultValue !== undefined) {
      db.prepare(`UPDATE users SET ${name} = ? WHERE ${name} IS NULL`).run(defaultValue);
    }
    console.log(`Added missing column users.${name}`);
  }
};

ensureUserColumn('avatarUrl', "TEXT DEFAULT '/avatar/Default.png'", '/avatar/Default.png');
ensureUserColumn('profileCardBgColor', "TEXT DEFAULT '#0f0f10'", '#0f0f10');
ensureUserColumn('profileCardStickers', "TEXT DEFAULT '[]'", '[]');
ensureUserColumn('profileCardTitles', "TEXT DEFAULT '[\"cinema\",\"quiz_master\"]'", '["cinema","quiz_master"]');
ensureUserColumn('profileCardDescription', "TEXT DEFAULT ''", '');
ensureUserColumn('lang', "TEXT DEFAULT 'en'", 'en');
ensureUserColumn('theme', "TEXT DEFAULT 'default'", 'default');
ensureUserColumn('font', "TEXT DEFAULT 'default'", 'default');

const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table'")
  .all();
console.log("Tables created:", tables);

const insertUser = db.prepare(
  "INSERT INTO users (username, email, password, avatarUrl) VALUES (?, ?, ?, ?)"
);

console.log("Checking seed data...");

db.close();
console.log("Database initialized successfully!");
