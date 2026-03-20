const db = require("../models/db");

function cron_gdpr() {
  const stmt = db.prepare(`
    DELETE FROM users
    WHERE lastConnexion IS NOT NULL
      AND lastConnexion < datetime('now', '-2 years')
      AND onlineStatus = 0
  `);
  const info = stmt.run();
  console.log(`[purgeInactiveUsers] Deleted users: ${info.changes}`);
}

module.exports = { cron_gdpr };
