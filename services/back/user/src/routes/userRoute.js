/**
 * User Routes :
 * In this route will be defined user id, global information, avatar
 * TODO: remove settings from here and create a specific settings file as for friend
 */


// Route : 127.0.0.1:3000/users/
const React = require("react");
const { render } = require("@react-email/render");
const { createZohoTransporter } = require("../services/userServices.js");
const DataExportConfirmationEmail = require("../mails/dataExportConfirmationEmail.js");
const AccountDeletionEmail = require("../mails/accountDeletionEmail.js");
const SignupEmail = require("../mails/signupEmail.js");
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
			return reply.code(500).send({ error: "Internal Server Error" });
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
			return reply.code(500).send({ error: "Internal Server Error" });
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
		catch (err)
		{
			request.log.error(err);
			return reply.code(500).send({ error: "Internal Server Error" });
		}
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

			const lang = user.preferredLanguage;
			const html = await render(React.createElement(DataExportConfirmationEmail, { username: user.username, lang: lang }));
			const transporter = createZohoTransporter();

			await transporter.sendMail({
				from: `"ft_transcendence" <ft_trans@zohomail.eu>`,
				to: "tristan.olivier.p@gmail.com",
				//to: user.email,
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
			return reply.code(500).send({ error: "MAIL_FAILED" });
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

			const lang = user.preferredLanguage;
			const html = await render(React.createElement(AccountDeletionEmail, { username: user.username, lang: lang }));
			const transporter = createZohoTransporter();

			await transporter.sendMail({
				from: `"ft_transcendence" <ft_trans@zohomail.eu>`,
				to: "tristan.olivier.p@gmail.com",
				//to: user.email,
				subject: subjectDelete[lang],
				html,
			});

			return reply.send({ success: true });
		} catch (err) {
			console.error(err);
			return reply.code(500).send({ error: "MAIL_FAILED" });
		}
	});

	fastify.post("/signup/mail", async (request, reply) => {
		try {
			const { userId, codeValidation } = request.body;
			if (!userId || !codeValidation) {
  				return reply.code(400).send({ error: "BAD_REQUEST" });
			}

			const user = await userController.getUserById(userId);
		    if (!user) {
      			return reply.code(404).send({ error: "USER_NOT_FOUND" });
    		}

			const html = await render(React.createElement(SignupEmail, { username: user.username, code: codeValidation}));
			const transporter = createZohoTransporter();

			await transporter.sendMail({
				from: `"ft_transcendence" <ft_trans@zohomail.eu>`,
				to: "tristan.olivier.p@gmail.com",
				//to: user.email,
				subject: `Welcome, ${user.username} !`,
				html,
			});

			return reply.send({ success: true });
		} catch (err) {
			console.error(err);
			return reply.code(500).send({ error: "MAIL_FAILED" });
		}
	});
}

module.exports = userRoutes;
