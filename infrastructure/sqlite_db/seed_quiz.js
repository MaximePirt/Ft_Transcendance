const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const dbPath = process.env.DB_PATH || false;
if (!dbPath) {
  console.error("Error: QUIZ_DB_PATH environment variable is not set.");
  process.exit(1);
}

const dataDir = process.env.QUIZ_DATA_DIR || path.join(__dirname, "data");

const db = new Database(dbPath);
db.pragma("foreign_keys = ON");

// json -> db
const typeMap = { qcm: "mcq", texte: "text", mcq: "mcq", text: "text" };

function inferLangFromFilename(filename) {
	const m = filename.match(/^([a-zA-Z-]+)\.questions\.json$/);
	return m ? m[1] : null;
}

function slugifyCategory(name) {
	return name
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

const upsertLanguage = db.prepare(`
	INSERT INTO languages (code) VALUES (?)
	ON CONFLICT(code) DO NOTHING
`);

const upsertCategory = db.prepare(`
	INSERT INTO categories (slug) VALUES (?)
	ON CONFLICT(slug) DO NOTHING
`);

const getCategoryIdBySlug = db.prepare(`SELECT id FROM categories WHERE slug = ?`);

const upsertCategoryTranslation = db.prepare(`
	INSERT INTO category_translations (category_id, lang, name)
	VALUES (?, ?, ?)
	ON CONFLICT(category_id, lang) DO UPDATE SET name = excluded.name
`);

const upsertQuestion = db.prepare(`
	INSERT INTO questions (external_id, category_id, type, difficulty)
	VALUES (?, ?, ?, ?)
	ON CONFLICT(external_id) DO UPDATE SET
		category_id = excluded.category_id,
		type = excluded.type,
		difficulty = excluded.difficulty
`);

const getQuestionIdByExternalId = db.prepare(`SELECT id, type FROM questions WHERE external_id = ?`);

const upsertQuestionTranslation = db.prepare(`
	INSERT INTO question_translations (question_id, lang, question_text)
	VALUES (?, ?, ?)
	ON CONFLICT(question_id, lang) DO UPDATE SET question_text = excluded.question_text
`);

const deleteTextSide = db.prepare(`DELETE FROM text_questions WHERE question_id = ?`);
const deleteMcqSide = db.prepare(`DELETE FROM mcq_questions WHERE question_id = ?`);
const deleteMcqOptions = db.prepare(`DELETE FROM mcq_options WHERE question_id = ?`);

// MCQ
const upsertMcqQuestion = db.prepare(`
  INSERT INTO mcq_questions (question_id, correct_option_position)
  VALUES (?, ?)
  ON CONFLICT(question_id) DO UPDATE SET correct_option_position = excluded.correct_option_position
`);

const upsertMcqOption = db.prepare(`
  INSERT INTO mcq_options (question_id, position)
  VALUES (?, ?)
  ON CONFLICT(question_id, position) DO NOTHING
`);

const getMcqOptionId = db.prepare(`
  SELECT id FROM mcq_options WHERE question_id = ? AND position = ?
`);

const deleteMcqOptionsFromPos = db.prepare(`
  DELETE FROM mcq_options WHERE question_id = ? AND position >= ?
`);

const upsertMcqOptionTranslation = db.prepare(`
  INSERT INTO mcq_option_translations (option_id, lang, label)
  VALUES (?, ?, ?)
  ON CONFLICT(option_id, lang) DO UPDATE SET label = excluded.label
`);

// TEXT
const ensureTextQuestion = db.prepare(`
  INSERT INTO text_questions (question_id)
  VALUES (?)
  ON CONFLICT(question_id) DO NOTHING
`);

const upsertTextAnswerTranslation = db.prepare(`
  INSERT INTO text_answer_translations (question_id, lang, answer, variants_json)
  VALUES (?, ?, ?, ?)
  ON CONFLICT(question_id, lang) DO UPDATE SET
    answer = excluded.answer,
    variants_json = excluded.variants_json
`);

function getAnswerField(q) {
  return q["réponse"] ?? q.reponse ?? q.answer;
}

function getDifficultyField(q) {
  return q["difficulté"] ?? q.difficulte ?? q.difficulty;
}

const seed = db.transaction(() => {
  const files = fs.readdirSync(dataDir).filter((f) => f.endsWith(".questions.json"));
  if (files.length === 0) throw new Error(`No *.questions.json found in ${dataDir}`);

  for (const file of files) {
    const lang = inferLangFromFilename(file);
    if (!lang) throw new Error(`Cannot infer lang from filename: ${file}`);

    upsertLanguage.run(lang);

    const json = JSON.parse(fs.readFileSync(path.join(dataDir, file), "utf-8"));
    const quizRoot = json?.Quiz?.[0];
    if (!quizRoot || typeof quizRoot !== "object") {
      throw new Error(`Invalid JSON in ${file}: expected { "Quiz": [ { ... } ] }`);
    }

    for (const [categoryName, questionsArr] of Object.entries(quizRoot)) {
      if (!Array.isArray(questionsArr)) continue;

      const categorySlug = slugifyCategory(categoryName);
      upsertCategory.run(categorySlug);

      const cat = getCategoryIdBySlug.get(categorySlug);
      if (!cat) throw new Error(`Cannot fetch category id for slug=${categorySlug}`);

      upsertCategoryTranslation.run(cat.id, lang, categoryName);

      for (const q of questionsArr) {
        if (!q.id) {
          console.log("Question data:", q);
          throw new Error(
            `Missing question.id in ${file} (category=${categoryName}). Add a stable id shared across languages.`
          );
        }

        const typeRaw = q.type;
        const type = typeMap[typeRaw];
        if (!type) throw new Error(`Unsupported type="${typeRaw}" for question.id=${q.id}`);

        const diffRaw = getDifficultyField(q);
		if (!diffRaw) throw new Error(`Missing difficulty for question.id=${q.id}`);

        upsertQuestion.run(q.id, cat.id, type, diffRaw);

        const qRow = getQuestionIdByExternalId.get(q.id);
        if (!qRow) throw new Error(`Cannot fetch question id for external_id=${q.id}`);

        upsertQuestionTranslation.run(qRow.id, lang, q.question);

        if (type === "mcq") {
          deleteTextSide.run(qRow.id);
        } else {
          deleteMcqSide.run(qRow.id);
          deleteMcqOptions.run(qRow.id);
        }

        if (type === "mcq") {
          const options = Array.isArray(q.options) ? q.options : [];
          const answer = getAnswerField(q);

          if (options.length < 2) throw new Error(`MCQ requires options[] for question.id=${q.id}`);
          const correctPos = options.indexOf(answer);
          if (correctPos < 0) throw new Error(`Answer not in options for question.id=${q.id}`);
          upsertMcqQuestion.run(qRow.id, correctPos);

          for (let i = 0; i < options.length; i++) {
            upsertMcqOption.run(qRow.id, i);
            const opt = getMcqOptionId.get(qRow.id, i);
            upsertMcqOptionTranslation.run(opt.id, lang, options[i]);
          }
          deleteMcqOptionsFromPos.run(qRow.id, options.length);
        }

        if (type === "text") {
          ensureTextQuestion.run(qRow.id);

          const answer = getAnswerField(q);
          if (!answer) throw new Error(`Missing answer for text question.id=${q.id}`);

          const variants = Array.isArray(q.variantes) ? q.variantes : [];
          upsertTextAnswerTranslation.run(qRow.id, lang, answer, JSON.stringify(variants));
        }
      }
    }

    console.log(`[quiz-seed] Seeded ${file} (lang=${lang})`);
  }
});

try {
  seed();
  console.log("[quiz-seed] Done.");
} catch (e) {
  console.error("[quiz-seed] Failed:", e);
  process.exit(1);
} finally {
  db.close();
}
