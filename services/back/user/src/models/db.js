const Database = require("better-sqlite3");

const db = new Database("/db/db.sqlite"), verbose = console.log;
if (db === null) {
  throw new Error("Failed to connect to the database.");
}
db.pragma('foreign_keys = ON');

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

try {
  ensureUserColumn('avatarUrl', "TEXT DEFAULT '/avatar/Default.png'", '/avatar/Default.png');
  ensureUserColumn('profileCardBgColor', "TEXT DEFAULT '#0f0f10'", '#0f0f10');
  ensureUserColumn('profileCardStickers', "TEXT DEFAULT '[]'", '[]');
  ensureUserColumn('profileCardTitles', "TEXT DEFAULT '[\"cinema\",\"quiz_master\"]'", '["cinema","quiz_master"]');
  ensureUserColumn('profileCardDescription', "TEXT DEFAULT ''", '');
  ensureUserColumn('lang', "TEXT DEFAULT 'en'", 'en');
  ensureUserColumn('theme', "TEXT DEFAULT 'default'", 'default');
  ensureUserColumn('font', "TEXT DEFAULT 'default'", 'default');
  db.prepare("UPDATE users SET avatarUrl = ? WHERE avatarUrl IS NULL OR avatarUrl = ''").run('/avatar/Default.png');
} catch (error) {
  console.error('Failed to ensure users columns:', error);
}


// Vérifie les tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log("Available tables:", tables);

module.exports = db;

