// Route : localhost:3000/users
userController = require('../controllers/userController');

async function userRoutes(fastify, options) {
  fastify.get("/users", async (request, reply) => {
    return await userController.getUsers();
    });
  fastify.get("/users/:id", async (request, reply) => {
    return await userController.getUserById(request.params.id);
  });

    fastify.patch('/users/:id', async (request, reply) => {
    const userId = request.params.id;
    const updateData = request.body;

    try {
      const updatedUser = await fastify.userController.updateUser(userId, updateData);
      if (!updatedUser) {
        return reply.code(404).send({ error: 'User not found' });
      }
      return updatedUser;
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  });
}

module.exports = userRoutes;

