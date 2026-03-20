const React = require("react");
const { render } = require("@react-email/render");
const { createZohoTransporter } = require("../services/userServices.js");
const DataExportConfirmationEmail = require("../mails/dataExportConfirmationEmail.js");
const AccountDeletionEmail = require("../mails/accountDeletionEmail.js");
userController = require("../controllers/userController");

const subjectExport = {
	"fr": "Éxportation de vos données personnelles",
	"en": "Export of your personal data",
	"ar": "تصدير بياناتك الشخصية",
};

const subjectDelete = {
	"fr": "Votre compte à été supprimé",
	"en": "Your account has been deleted",
	"ar": "تم حذف حسابك",
};

const AUTH_URL = process.env.AUTH_API_URL || false;
if (!AUTH_URL) {
	console.error("AUTH_API_URL environment variable is not set.");
	process.exit(1);
}

const USERNAME_REGEX = /^[\p{Script=Arabic}a-zA-Z0-9_]{3,16}$/u;

const sanitizeUser = (user) => {
	if (!user) return user;
	const { password, ...safeUser } = user;
	return safeUser;
};

const getAuthenticatedUserId = async (request) => {
	const cookieHeader = request.headers.cookie;
	if (!cookieHeader) return null;

	const meResponse = await fetch(`${AUTH_URL}/me`, {
		method: "GET",
		headers: { cookie: cookieHeader },
	});

	if (!meResponse.ok) return null;
	const me = await meResponse.json();
	const meId = Number(me?.id);
	if (!Number.isInteger(meId) || meId <= 0) return null;
	return meId;
};

async function userRoutes(fastify, options) {
	// Get informations
	fastify.get("/users", async (request, reply) => {
		const users = await userController.getUsers();
		return Array.isArray(users) ? users.map(sanitizeUser) : [];
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
			return reply.status(401).send({ message: "could not update online status" });
		}
		console.log("User signed in successfully");
		return reply.status(200).send({ message: "ok" });
	})


	fastify.get("/me_id", {onRequest: [fastify.authenticate]}, async (request, reply) => {
		const userId = request.user.id;
		console.log("Authenticated user ID:", userId);
		if (!userId) {
			return reply.code(400).send({ error: "User ID is required" });
		}
		const user = await userController.getUserById(userId);
		if (!user) {
			return reply.code(404).send({ error: "User not found" });
		}
		return { id: user.id };
	})

	fastify.get("/userid/soft/:username", async (request, reply) => {
		const username = request.params.username;
		if (!username) {
			return reply.code(400).send({ error: "Username parameter is required" });
		}
		try {
			const user = await userController.getUserByUsername(username);
			if (!user) {
				return reply.code(200).send({ id: null });
			}
			return reply.code(200).send({ id: user.id });
		} catch (error) {
			if (String(error?.message).includes("User not found")) {
				return reply.code(200).send({ id: null });
			}
			request.log.error(error);
			return reply.code(401).send({ error: "Internal Server Error" });
		}
	});

	fastify.get("/userid/:username", async (request, reply) => {
		const username = request.params.username;
		if (!username) {
			return reply.code(400).send({ error: "Username parameter is required" });
		}
		try {
			const user = await userController.getUserByUsername(username);
			if (!user) {
				return reply.code(404).send({ error: "User not found" });
			}
			return { id: user.id };
		} catch (error) {
			if (String(error?.message).includes("User not found")) {
				return reply.code(404).send({ error: "User not found" });
			}
			request.log.error(error);
			return reply.code(401).send({ error: "Internal Server Error" });
		}
	});

	fastify.get("/:id/matches", async (request, reply) => {
		const userId = Number(request.params.id);
		if (!Number.isInteger(userId) || userId <= 0) {
			return reply.code(400).send({ error: "Invalid user id" });
		}
		const limit = Number(request.query?.limit || 3);
		try {
			const matches = await userController.getRecentMatchesByUserId(userId, limit);
			return reply.code(200).send({ result: matches });
		} catch (error) {
			request.log.error(error);
			return reply.code(401).send({ error: "Internal Server Error" });
		}
	});

	fastify.get('/leaderboard/wins', async (request, reply) => {
		const limit = Number(request.query?.limit || 5);
		try {
			const leaderboard = await userController.getWinsLeaderboard(limit);
			return reply.code(200).send({ result: leaderboard });
		} catch (error) {
			request.log.error(error);
			return reply.code(401).send({ error: 'Internal Server Error' });
		}
	});

	/**
	 * @brief Get user statistics
	 * @input : user_id
	 * @rules : only if user exists
	 * @return : a JSON object containing user statistics
	 * 	Theses are the stats that we want to return :
	 * 	- total_matches
	 * 	- wins
	 * 	- total_score
	 * 	- answered
	 * 	- correct
	 * 	- win_rate
	 * 	- accuracy
	 */
	fastify.get("/:id/stats", async (request, reply) => {
		console.log("Received request for user stats with ID:", request.params.id);
		const userId = Number(request.params.id);
		try {
			const stats = await userController.getUserStatsById(userId);
			if (!stats) {
				return reply.code(404).send({ error: "User not found" });
			}
			return reply.code(200).send({ result: stats });
		}
		catch (err) {
			request.log.error(err);
			return reply.code(401).send({ error: "Internal Server Error" });
		}
	});

	fastify.get("/:id/achievements", async (request, reply) => {
		const userId = Number(request.params.id);
		try {
			const achievements = await userController.getUserAchievementsById(userId);
			return reply.code(200).send({ result: achievements });
		}
		catch (err) {
			request.log.error(err);
			if (String(err?.message).includes('Invalid user ID')) {
				return reply.code(400).send({ error: 'Invalid user ID' });
			}
			if (String(err?.message).includes('User not found')) {
				return reply.code(404).send({ error: 'User not found' });
			}
			return reply.code(401).send({ error: "Internal Server Error" });
		}
	});

	fastify.get("/:id", async (request, reply) => {
		try {
			const res = await userController.getUserById(request.params.id);
			if (!res)
				return reply.code(404).send({ error: "User not found" });
			return sanitizeUser(res);
		} catch (error) {
			if (String(error?.message).includes('User not found')) {
				return reply.code(404).send({ error: 'User not found' });
			}
			request.log.error(error);
			return reply.code(401).send({ error: 'Internal Server Error' });
		}
	});

	fastify.get("/users/soft/:id", async (request, reply) => {
		try {
			const userId = request.params.id;
			const user = await userController.getUserById(userId);
			if (!user) {
				return reply.code(200).send({ user: null });
			}
			return reply.code(200).send({ user: sanitizeUser(user) });
		} catch (error) {
			if (String(error?.message).includes('User not found')) {
				return reply.code(200).send({ user: null });
			}
			request.log.error(error);
			return reply.code(401).send({ error: 'Internal Server Error' });
		}
	});

	fastify.get("/users/:id", async (request, reply) => {
		try {
			const userId = request.params.id;
			const user = await userController.getUserById(userId);
			if (!user) {
				return reply.code(404).send({ error: 'User not found' });
			}
			return sanitizeUser(user);
		} catch (error) {
			if (String(error?.message).includes('User not found')) {
				return reply.code(404).send({ error: 'User not found' });
			}
			request.log.error(error);
			return reply.code(401).send({ error: 'Internal Server Error' });
		}
	});

	fastify.patch("/:id", async (request, reply) => {
		const userId = request.params.id;
		const userIdNumber = Number(userId);
		if (!Number.isInteger(userIdNumber) || userIdNumber <= 0) {
			return reply.code(400).send({ error: "Invalid user id" });
		}

		const requesterId = await getAuthenticatedUserId(request);
		if (!requesterId) {
			return reply.code(401).send({ error: "Unauthorized" });
		}
		if (requesterId !== userIdNumber) {
			return reply.code(403).send({ error: "Forbidden" });
		}

		const updateData = request.body;
		if (typeof updateData?.username === 'string') {
			const normalizedUsername = updateData.username.trim();
			if (!USERNAME_REGEX.test(normalizedUsername)) {
				return reply.code(400).send({ error: 'Invalid username format' });
			}
			updateData.username = normalizedUsername;
		}
		try {
			const updatedUser = await userController.updateUser(userId, updateData);
			if (!updatedUser) {
				return reply.code(404).send({ error: "User not found" });
			}
			return sanitizeUser(updatedUser);
		} catch (error) {
			request.log.error(error);
			if (String(error?.message).includes('Username already taken')) {
				return reply.code(409).send({ error: 'Username already taken by another account' });
			}
			if (String(error?.message).includes('Email already taken')) {
				return reply.code(409).send({ error: 'Email already taken by another account' });
			}
			return reply.code(401).send({ error: "Internal Server Error" });
		}
	});

	fastify.patch("/:id/avatar", async (request, reply) => {
		const userId = request.params.id;
		const userIdNumber = Number(userId);
		if (!Number.isInteger(userIdNumber) || userIdNumber <= 0) {
			return reply.code(400).send({ error: "Invalid user id" });
		}

		const requesterId = await getAuthenticatedUserId(request);
		if (!requesterId) {
			return reply.code(401).send({ error: "Unauthorized" });
		}
		if (requesterId !== userIdNumber) {
			return reply.code(403).send({ error: "Forbidden" });
		}

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
			return reply.code(401).send({ error: "Internal Server Error" });
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
		const userIdNumber = Number(userId);
		if (!Number.isInteger(userIdNumber) || userIdNumber <= 0) {
			return reply.code(400).send({ error: "Invalid user id" });
		}

		const requesterId = await getAuthenticatedUserId(request);
		if (!requesterId) {
			return reply.code(401).send({ error: "Unauthorized" });
		}
		if (requesterId !== userIdNumber) {
			return reply.code(403).send({ error: "Forbidden" });
		}

		const userData = request.body;
		if (typeof userData?.username === 'string') {
			const normalizedUsername = userData.username.trim();
			if (!USERNAME_REGEX.test(normalizedUsername)) {
				return reply.code(400).send({ error: 'Invalid username format' });
			}
			userData.username = normalizedUsername;
		}
		const updated = await userController.updateUser(userId, userData);
		return sanitizeUser(updated);
	});

	fastify.post("/export-data/mail", async (request, reply) => {
		try {
			const { userId, data } = request.body;
			if (!userId || !data) {
				return reply.code(400).send({ error: "BAD_REQUEST" });
			}

			const user = await userController.getUserById(userId);
			if (!user) {
				return reply.code(404).send({ error: "USER_NOT_FOUND" });
			}

			const lang = user.lang;
			const html = await render(React.createElement(DataExportConfirmationEmail, { username: user.username, lang: lang }));
			const transporter = createZohoTransporter();

			await transporter.sendMail({
				from: `"ft_transcendence" <ft_trans@zohomail.eu>`,
				to: user.email,
				subject: subjectExport[lang],
				html,
				attachments: [
					{
						filename: `${user.username}-data.json`,
						content: JSON.stringify(data, null, 2),
						contentType: "application/json",
					},
				],
			});

			return reply.send({ success: true });
		} catch (err) {
			console.error(err);
			return reply.code(401).send({ error: "MAIL_FAILED" });
		}
	});

	fastify.post("/delete-data/mail", async (request, reply) => {
		try {
			const { userId } = request.body;
			if (!userId) {
  				return reply.code(400).send({ error: "BAD_REQUEST" });
			}

			const user = await userController.getUserById(userId);
		    if (!user) {
      			return reply.code(404).send({ error: "USER_NOT_FOUND" });
    		}

			const lang = user.lang;
			const html = await render(React.createElement(AccountDeletionEmail, { username: user.username, lang: lang }));
			const transporter = createZohoTransporter();

			await transporter.sendMail({
				from: `"ft_transcendence" <ft_trans@zohomail.eu>`,
				to: user.email,
				subject: subjectDelete[lang],
				html,
			});

			return reply.send({ success: true });
		} catch (err) {
			console.error(err);
			return reply.code(401).send({ error: "MAIL_FAILED" });
		}
	});

	

	fastify.delete("/delete-user", async (request, reply) => {
		try {
			const { userId } = request.body;
			if (!userId)
				return reply.code(400).send({ error: "BAD_REQUEST" });

			const userIdNumber = Number(userId);
			if (!Number.isInteger(userIdNumber) || userIdNumber <= 0) {
				return reply.code(400).send({ error: "BAD_REQUEST" });
			}

			let relatedUserIds = [];
			try {
				relatedUserIds = friendModel.listRelatedUserIds(userIdNumber);
			} catch (err) {
				request.log.error(err);
				relatedUserIds = [];
			}

			await userController.deleteUser(userIdNumber);

			if (relatedUserIds.length > 0) {
				friendWsHub.notifyUsers(relatedUserIds, {
					type: "friend_updated",
					payload: { reason: "account_deleted", userId: userIdNumber },
				});
			}
			return reply.send({ success: true });
		}
		catch (err) {
			console.error(err);
			return reply.code(401).send({ error: "USER_DELETE_FAILED" });
		}
	});

	fastify.get("/user-ingame/:id", async (request, reply) => {
		try {
			const userId = request.params.id;
			if (!userId)
				return reply.code(400).send({ error: "BAD_REQUEST" });

			const isInGame = await userController.isUserInAGame(userId);
			return reply.code(200).send({ ingame: isInGame });
		}
		catch (err) {
			console.error(err);
			return reply.code(401).send({ error: "AN_UNEXPECTED_ERROR_HAS_OCCURED" });
		}
	});
}

module.exports = userRoutes;