// services/user/src/app.js
// This microservice is here to handle :
/*
- User data management (CRUD operations)
- User profile management as avatar
- User friends
- User stats

It listen on porte 3001

*/

const fastify = require("fastify")({ logger: true });
fastify.register(require("@fastify/multipart"));
fastify.register(require("./routes/userRoute"));
fastify.register(require("./routes/friendRoute"));


fastify.register(require("@fastify/cors"), {
	origin: ["http://localhost:5173", "http://user_api:3001"],
	methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
	credentials: true,
	allowedHeaders: ["Content-type", "Authorization"],
});



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
// TODO: Change to 3AM, currently every 2 minutes for testing
const purgeJob = new CronJob(
  {
    cronExpression: "*/2 * * * *",
  },
  purgeTask
);

const start = async () => {
  try {
    await fastify.ready();
    fastify.scheduler.addCronJob(purgeJob);
    await fastify.listen({ port: 3001, host: "user_api" });
    console.log("Microservice Users listening on port 3001");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
