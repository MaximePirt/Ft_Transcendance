const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const dbPath = process.env.GAME_DB_PATH || false;
if (!dbPath) {
	console.error("Error: GAME_DB_PATH environment variable is not set.");
	process.exit(1);
}

console.log(`[game-db] Database path: ${dbPath}`);

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

if (fs.existsSync(dbPath)) {
	console.log("[game-db] Database already exists. Skipping initialization.");
	process.exit(0);
}

const db = new Database(dbPath);

db.pragma("foreign_keys = ON");


/**
 * const createGameTable = `
CREATE TABLE IF NOT EXISTS games (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	date_played DATETIME DEFAULT CURRENT_TIMESTAMP,
	winner_id INTEGER NULL,
	mode TEXT CHECK( mode IN ('easy', 'medium', 'hard')) NOT NULL DEFAULT 'medium',
	tournament INTEGER NOT NULL DEFAULT 0,
	FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE CASCADE
);
`;

const createGamePlayersTable = `
CREATE TABLE IF NOT EXISTS game_players (
	game_id INTEGER NOT NULL,
	user_id INTEGER NOT NULL,
	score INTEGER NOT NULL DEFAULT '0',
	winner BOOLEAN NOT NULL DEFAULT '0',
	PRIMARY KEY (game_id, user_id),
	FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
`;
 */

const createTables = `
BEGIN;

-- Game_sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	ended_at DATETIME,
	status TEXT CHECK( status IN ('waiting', 'in_progress', 'completed', 'abandoned') ) NOT NULL DEFAULT 'waiting',
	mode TEXT CHECK( mode IN ('easy', 'medium', 'hard') ) NOT NULL DEFAULT 'medium',
	topic TEXT,
	question_count INTEGER NOT NULL DEFAULT 10,
	max_players INTEGER NOT NULL DEFAULT 4,
	winner_id INTEGER,
	FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Game_players table - associates users with game sessions
CREATE TABLE IF NOT EXISTS game_players (
	game_session_id INTEGER NOT NULL,
	user_id INTEGER NOT NULL,
	joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	answered_count INTEGER NOT NULL DEFAULT 0,
	correct_answers INTEGER NOT NULL DEFAULT 0,
	accuracy REAL DEFAULT 0
	score INTEGER NOT NULL DEFAULT 0,
	is_winner BOOLEAN NOT NULL DEFAULT 0,
	PRIMARY KEY (game_session_id, user_id),
	FOREIGN KEY (game_session_id) REFERENCES game_sessions(id) ON DELETE CASCADE,
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

COMMIT;
`;

try {
	console.log("[game-db] Creating tables...");
	db.exec(createTables);
	console.log("[game-db] Tables created successfully.");
}
catch (err) {
	console.error("[game-db] Error creating tables:", err);
	process.exit(1);
}

db.close();
console.log("[game-db] Database initialization complete.");