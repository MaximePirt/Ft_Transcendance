const fastify = require("fastify")({ logger: true });
fastify.register(require('./routes/userRoute'));
// fastify.register(require('./models/userModels'));
// fastify.register(require('./controllers/userController'));


fastify.get("/ping", async (request, reply) => {
  return { pong: "it works!" };
});


const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
