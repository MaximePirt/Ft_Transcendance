require('dotenv').config();

const fastify = require("fastify")({ logger: true });

// Register CORS
fastify.register(require('@fastify/cors'), {
  origin: true,
  credentials: true
});

fastify.register(require("./routes/tournamentRoute"));

// Health check
fastify.get('/', async (request, reply) => {
  return {
    status: 'Blockchain service running',
    version: '1.0.0',
    network: 'Avalanche Fuji Testnet'
  };
});

const start = async () => {
  try {
    await fastify.listen({ port: 3004, host: "0.0.0.0" });
    console.log("🔗 Blockchain service listening on port 3004");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();