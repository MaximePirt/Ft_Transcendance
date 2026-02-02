const { spawnSync } = require("child_process");

function run(script) {
  const res = spawnSync("node", [script], { stdio: "inherit" });
  if (res.status !== 0) process.exit(res.status);
}

console.log("Initializing all databases...");
run("./user_db.js");
run("./quiz_db.js");
run("./seed_quiz.js");
run("./game_db.js");
console.log("All databases initialized successfully.");