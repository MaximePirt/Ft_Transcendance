/**
 * User Routes :
 * In this route will be defined user id, global information, avatar
 * TODO: remove settings from here and create a specific settings file as for friend
 */


// Route : 127.0.0.1:3000/users/
userController = require("../controllers/userController");


async function userRoutes(fastify, options) {
  // Get informations
  fastify.get("/users", async (request, reply) => {
    return await userController.getUsers();
  });

  fastify.get("/users/:id", async (request, reply) => {
    return await userController.getUserById(request.params.id);
  });
  // Update informations
  fastify.patch("/users/:id", async (request, reply) => {
    const userId = request.params.id;
    const updateData = request.body;
    try {
      const updatedUser = await userController.updateUser(userId, updateData);
      if (!updatedUser) {
        return reply.code(404).send({ error: "User not found" });
      }
      return updatedUser;
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: "Internal Server Error" });
    }
  });

  // Avatar upload
  fastify.patch("/users/:id/avatar", async (request, reply) => {
    const userId = request.params.id;
    const data = await request.file();
    if (!data)
      return reply.code(400).send({ error: "No file uploaded" });
    return await userController.updateAvatar(userId, data);
  });

  // settings
  fastify.get("/users/:id/settings", async (request, reply) => {
    const userId = request.params.id;
    const data = await request.file();
    if (!data)
        return reply.code(400).send({error : "No file uploaded"});
    return await userController.addAvatar(userId, data);
  });

  
}

module.exports = userRoutes;
