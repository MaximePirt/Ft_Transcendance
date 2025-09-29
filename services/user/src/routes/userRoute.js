// Route : localhost:3000/users
userController = require('../controllers/userController');

async function userRoutes(fastify, options) {
  fastify.get("/users", async (request, reply) => {
    return await userController.getUsers();
    });
}

module.exports = userRoutes;

