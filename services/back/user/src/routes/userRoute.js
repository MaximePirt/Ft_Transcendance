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

	fastify.post("/signin", async (request, reply) => {
		const data = await request.body;
		const username = data.username;
		const password = data.password;
		const user = await userController.getUser(username, password)
		if (user == 'unknown user') {
			console.log("Unknown user attempted to sign in with username:", username);
			return reply.status(401).send({ message: "unknown user" });
		} else if (user == 'bad password') {
			console.log("User found but bad password for username:", username);
			return reply.status(401).send({ message: "bad password" });
		}
		const user_id = await userController.getUserByUsername(username);
		const online = await userController.updateUser(user_id.id, { onlineStatus: 1 });
		if (!online) {
			return reply.status(500).send({ message: "could not update online status" });
		}
		console.log("User signed in successfully");
		return reply.status(200).send({ message: "ok" });
	})


	fastify.get("/me_id", async (request, reply) => {
		const username = request.headers.username;
		if (!username) {
			return reply.code(400).send({ error: "Username header is required" });
		}
		const user = await userController.getUserByUsername(username);
		if (!user) {
			return reply.code(404).send({ error: "User not found" });
		}
		return { id: user.id };
	})

	fastify.get("/userid/:username", async (request, reply) => {
		const username = request.params.username;
		if (!username) {
			return reply.code(400).send({ error: "Username parameter is required" });
		}
		const user = await userController.getUserByUsername(username);
		if (!user) {
			return reply.code(401).send({ error: "User not found" });
		}
		return { id: user.id };
	});

	
	fastify.get("/:id", async (request, reply) => {
		const res = await userController.getUserById(request.params.id);
		if (!res)
			return reply.code(404).send({ error: "User not found" });
		return res;
	});

	fastify.get("/users/:id", async (request, reply) => {
		const userId = request.params.id;
		return await userController.getUserById(userId);
	});

	fastify.patch("/:id", async (request, reply) => {
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

	fastify.patch("/:id/avatar", async (request, reply) => {
		const userId = request.params.id;
		const data = await request.file();
		if (!data)
			return reply.code(400).send({ error: "No file uploaded" });
		try {
			return await userController.updateAvatar(userId, data);
		} catch (error) {
			request.log.error(error);
			if (String(error?.message).includes("Invalid file type")) {
				return reply.code(400).send({ error: "Invalid file type, only PNG and JPEG are allowed" });
			}
			return reply.code(500).send({ error: "Internal Server Error" });
		}
	});

	fastify.get("/:id/settings", async (request, reply) => {
		const userId = request.params.id;
		const data = await request.file();
		if (!data)
			return reply.code(400).send({ error: "No file uploaded" });
		return await userController.addAvatar(userId, data);
	});

	fastify.get("/:username/online", async (request, reply) => {
		const username = request.params.username;
		const user = await userController.getUserByUsername(username);
		if (!user) {
			return reply.code(404).send({ error: "User not found" });
		}
		return { onlineStatus: user.onlineStatus };
	});

	fastify.put("/users/:id", async (request, reply) => {
		const userId = request.params.id;
		const userData = request.body;
		return await userController.updateUser(userId, userData);
	});

}

module.exports = userRoutes;
