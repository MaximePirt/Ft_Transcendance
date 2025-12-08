const tournamentController = require("../controllers/tournamentController");

async function tournamentRoutes(fastify, options) {

  // GET /tournament/score/:id - Récupérer un score
  fastify.get("/tournament/score/:id", async (request, reply) => {
    try {
      const tournamentId = request.params.id;
      const result = await tournamentController.getTournamentScore(tournamentId);
      return result;
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: error.message
      });
    }
  });

  // POST /tournament/score - Sauvegarder un score
  fastify.post("/tournament/score", async (request, reply) => {
    try {
      const scoreData = request.body;

      if (!scoreData.id || !scoreData.player1 || !scoreData.player2) {
        return reply.code(400).send({
          success: false,
          error: 'Missing required fields: id, player1, player2'
        });
      }

      const result = await tournamentController.saveTournamentScore(scoreData);
      return result;
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: error.message
      });
    }
  });


  fastify.get("/tournament/health", async (request, reply) => {
    return {
      status: 'healthy',
      service: 'blockchain',
      network: 'Avalanche Fuji',
      timestamp: new Date().toISOString()
    };
  });
}

module.exports = tournamentRoutes;
