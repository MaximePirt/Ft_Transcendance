const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const dbPath = process.env.DB_PATH || false;
if (!dbPath) {
  console.error("Error: QUIZ_DB_PATH environment variable is not set.");
  process.exit(1);
}

console.log(`[quiz-db] Database path: ${dbPath}`);

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(dbPath);

db.pragma("foreign_keys = ON");

const createTables = `
BEGIN;

CREATE TABLE IF NOT EXISTS languages (
  code TEXT PRIMARY KEY,
  name TEXT
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS category_translations (
  category_id INTEGER NOT NULL,
  lang TEXT NOT NULL,
  name TEXT NOT NULL,
  PRIMARY KEY (category_id, lang),
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  FOREIGN KEY (lang) REFERENCES languages(code) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  external_id TEXT UNIQUE,
  category_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('mcq', 'text')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'random')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS question_translations (
  question_id INTEGER NOT NULL,
  lang TEXT NOT NULL,
  question_text TEXT NOT NULL,
  PRIMARY KEY (question_id, lang),
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  FOREIGN KEY (lang) REFERENCES languages(code) ON DELETE RESTRICT
);

CREATE TRIGGER IF NOT EXISTS trg_questions_updated_at
AFTER UPDATE ON questions
FOR EACH ROW
BEGIN
  UPDATE questions
  SET updated_at = datetime('now')
  WHERE id = OLD.id;
END;

-- MCQ
CREATE TABLE IF NOT EXISTS mcq_questions (
  question_id INTEGER PRIMARY KEY,
  correct_option_position INTEGER NOT NULL,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mcq_options (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER NOT NULL,
  position INTEGER NOT NULL,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  UNIQUE(question_id, position)
);

CREATE TABLE IF NOT EXISTS mcq_option_translations (
  option_id INTEGER NOT NULL,
  lang TEXT NOT NULL,
  label TEXT NOT NULL,
  PRIMARY KEY (option_id, lang),
  FOREIGN KEY (option_id) REFERENCES mcq_options(id) ON DELETE CASCADE,
  FOREIGN KEY (lang) REFERENCES languages(code) ON DELETE RESTRICT
);

-- TEXT
CREATE TABLE IF NOT EXISTS text_questions (
  question_id INTEGER PRIMARY KEY,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- JSON VARIANT (JSON1)
CREATE TABLE IF NOT EXISTS text_answer_translations (
  question_id INTEGER NOT NULL,
  lang TEXT NOT NULL,
  answer TEXT NOT NULL,
  variants_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(variants_json)),
  PRIMARY KEY (question_id, lang),
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  FOREIGN KEY (lang) REFERENCES languages(code) ON DELETE RESTRICT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category_id);
CREATE INDEX IF NOT EXISTS idx_questions_type_diff ON questions(type, difficulty);
CREATE INDEX IF NOT EXISTS idx_qt_lang ON question_translations(lang);
CREATE INDEX IF NOT EXISTS idx_ct_lang ON category_translations(lang);

COMMIT;
`;


try {
  console.log("[quiz-db] Creating tables...");
  db.exec(createTables);
  console.log("[quiz-db] Tables created (or already exist).");
} catch (err) {
	console.error("[quiz-db] Error creating tables:", err);
	process.exit(1);
}

const langs = (process.env.QUIZ_LANGS || "fr,en").split(",").map(s => s.trim()).filter(Boolean);
const insertLang = db.prepare("INSERT OR IGNORE INTO languages (code) VALUES (?)");
for (const code of langs) insertLang.run(code);

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log("[quiz-db] Tables:", tables.map(t => t.name));

db.close();
console.log("[quiz-db] Database initialized successfully!");
