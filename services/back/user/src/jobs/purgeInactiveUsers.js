const db = require("../models/db");

function cron_gdpr() {
  const stmt = db.prepare(`
    DELETE FROM users
    WHERE last_activity_at IS NOT NULL
      AND last_activity_at < datetime('now', '-2 years')
  `);
  const info = stmt.run();
  console.log(`[purgeInactiveUsers] Deleted users: ${info.changes}`);
}

module.exports = { cron_gdpr };
