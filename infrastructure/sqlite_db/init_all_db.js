const { spawnSync } = require("child_process");

function run(script) {
  const res = spawnSync("node", [script], { stdio: "inherit" });
  if (res.status !== 0) process.exit(res.status);
}

console.log("Initializing all databases...");
run("./user_db.js");
run("./quizz_db.js");
run("./seed_quizz.js");
console.log("All databases initialized successfully.");