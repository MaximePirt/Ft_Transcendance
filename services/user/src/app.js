// services/user/src/app.js
// This microservice is here to handle :
/*
- User data management (CRUD operations)
- User profile management as avatar
- User friends
- User stats
*/

const fastify = require("fastify")({ logger: true });

fastify.register(require("./routes/userRoute"));

const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: "0.0.0.0" });
    console.log("Microservice Users listening on port 3001");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
