const fastify = require("fastify")({ logger: true });
const path = require("path");
const fastifyJwt = require("@fastify/jwt");

const jwt_secret = process.env.JWT_SECRET || false;
if (!jwt_secret) {
	console.error("JWT_SECRET environment variable is not set.");
	process.exit(1);
}

fastify.register(require("@fastify/cookie"), {
	secret: jwt_secret,
	parseOptions: {}
});


fastify.register(fastifyJwt, {
  secret: jwt_secret,
  cookie: {
    cookieName: "token",
    signed: false
  }
});

fastify.register(require("./plugins/auth"));
fastify.register(require("@fastify/multipart"));
fastify.register(require("@fastify/static"), {
  root: path.join(__dirname, "..", "uploads"),
  prefix: "/uploads/",
});

let websocketEnabled = false;
try {
  const websocketPlugin = require("@fastify/websocket");
  fastify.register(websocketPlugin);
  websocketEnabled = true;
} catch (error) {
  fastify.log.info("@fastify/websocket not found, websocket routes disabled");
}

if (websocketEnabled) {
  fastify.register(require("./routes/wsRoute"));
}


fastify.register(require("@fastify/cors"), {
  origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://user_api:3001"],
	methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
	credentials: true,
	allowedHeaders: ["Content-type", "Authorization"],
});

fastify.register(require("./routes/userRoute"));
fastify.register(require("./routes/friendRoute"));


const schedule = require("@fastify/schedule");
const { CronJob, AsyncTask } = require("toad-scheduler");
fastify.register(schedule);

// Schedule job task
const purgeTask = new AsyncTask(
  "purgeUsersJob",
  async () => {
    const { cron_gdpr } = require("./jobs/purgeInactiveUsers");
    await cron_gdpr();
  },
  (error) => {
    fastify.log.error(error, "Error during purgeInactiveUsers job:");
  }
);

// Schedule job timing at 3 AM daily
const purgeJob = new CronJob(
  {
	cronExpression: "0 3 * * *",
  },
  purgeTask
);

const start = async () => {
  try {
    await fastify.ready();
    fastify.scheduler.addCronJob(purgeJob);
    await fastify.listen({ port: 3001, host: "0.0.0.0" });
    console.log("Microservice Users listening on port 3001");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
