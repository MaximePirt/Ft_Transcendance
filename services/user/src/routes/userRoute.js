// Route : 127.0.0.1:3000/users/
userController = require("../controllers/userController");
const fs = require("fs");
const { pipeline } = require("stream/promises");
const path = require("path");

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

    if (!["image/png", "image/jpeg"].includes(data.mimetype)) {
      return reply
        .code(400)
        .send({ error: "Invalid file type, only PNG and JPEG are allowed" });
    }
    const ext = data.mimetype === "image/png" ? "png" : "jpg";
    const filePath = `/uploads/avatars/${userId}-${Date.now()}.${ext}`;

    const uploadDir = path.join(__dirname, "../../uploads/avatars");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    await pipeline(data.file, fs.createWriteStream(`.${filePath}`));

    await userController.updateUser(userId, { avatarUrl: filePath });
    return { message: "Avatar uploaded", avatarUrl: filePath };
  });
}

module.exports = userRoutes;
