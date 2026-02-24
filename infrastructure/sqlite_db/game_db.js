const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const dbPath = process.env.DB_PATH || false;
if (!dbPath) {
	console.error("Error: GAME_DB_PATH environment variable is not set.");
	process.exit(1);
}

console.log(`[game-db] Database path: ${dbPath}`);

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });


const db = new Database(dbPath);

db.pragma("foreign_keys = ON");


const createTables = `
BEGIN;

-- Game_sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	code TEXT UNIQUE NOT NULL,
	started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	ended_at DATETIME,
	status TEXT CHECK( status IN ('waiting', 'in_progress', 'completed', 'abandoned') ) NOT NULL DEFAULT 'waiting',
	mode TEXT CHECK( mode IN ('easy', 'medium', 'hard', 'random') ) NOT NULL DEFAULT 'random',
	topic TEXT,
	power_ups TEXT DEFAULT '[]',
	question_count INTEGER NOT NULL DEFAULT 10,
	max_players INTEGER NOT NULL DEFAULT 4,
	host_id INTEGER NULL,
	is_solo INTEGER NOT NULL DEFAULT 0,
	current_question_order INTEGER NOT NULL DEFAULT 0,
	current_question_time DATETIME,
	FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Game_players table - associates users with game sessions
CREATE TABLE IF NOT EXISTS game_players (
	game_session_id INTEGER NOT NULL,
	user_id INTEGER NOT NULL,
	joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	answered_count INTEGER NOT NULL DEFAULT 0,
	correct_answers INTEGER NOT NULL DEFAULT 0,
	powerups_count INTEGER NOT NULL DEFAULT 0,
	score INTEGER NOT NULL DEFAULT 0,
	current_question_time DATETIME DEFAULT CURRENT_TIMESTAMP,
	is_winner BOOLEAN NOT NULL DEFAULT 0,
	is_active BOOLEAN NOT NULL DEFAULT 1,
	disconnected_at DATETIME,
	PRIMARY KEY (game_session_id, user_id),
	FOREIGN KEY (game_session_id) REFERENCES game_sessions(id) ON DELETE CASCADE,
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Powerups table 
CREATE TABLE IF NOT EXISTS game_powerups (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	game_session_id INTEGER NOT NULL,
	user_id INTEGER NOT NULL,
	question_order INTEGER NOT NULL,
	powerup_type TEXT NOT NULL,
	used BOOLEAN DEFAULT 0,
	used_at DATETIME,
	granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (game_session_id) REFERENCES game_sessions(id) ON DELETE CASCADE,
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create a question pool
CREATE TABLE IF NOT EXISTS game_session_questions (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	game_session_id INTEGER NOT NULL,
	question_id INTEGER NOT NULL,
	question_order INTEGER NOT NULL,
	FOREIGN KEY (game_session_id) REFERENCES game_sessions(id) ON DELETE CASCADE,
	FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE SET NULL,
	UNIQUE(game_session_id, question_id)
);

-- Game_answers table - save answers given by users during game_sessions
CREATE TABLE IF NOT EXISTS game_answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_session_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    question_id INTEGER,
    answer_given TEXT,
    is_correct BOOLEAN NOT NULL DEFAULT 0,
    time_taken INTEGER DEFAULT 0,
    answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_session_id) REFERENCES game_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_game_answers_session_user_question
ON game_answers(game_session_id, user_id, question_id);


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