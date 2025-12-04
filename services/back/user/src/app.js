// services/user/src/app.js
// This microservice is here to handle :
/*
- User data management (CRUD operations)
- User profile management as avatar
- User friends
- User stats
*/

const fastify = require("fastify")({ logger: true });
fastify.register(require("@fastify/multipart"));
fastify.register(require("./routes/userRoute"));
fastify.register(require("./routes/friendRoute"));

const schedule = require("@fastify/schedule");
const { CronJob, AsyncTask } = require("toad-scheduler");
fastify.register(schedule);

// Schedule job task
const purgeTask = new AsyncTask(
  "purgeUsersJob",
  async () => {
    const { cron_gdpr } = require("./src/jobs/purgeInactiveUsers");
    await cron_gdpr();
  },
  (error) => {
    fastify.log.error("Error during purgeInactiveUsers job:", error);
  }
);

// Schedule job timing at 3 AM daily
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
    await fastify.listen({ port: 3001, host: "0.0.0.0" });
    fastify.log.info(`Microservice Users listening on port 3001`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
