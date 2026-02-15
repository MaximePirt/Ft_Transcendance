authController = require("../controllers/authController");

const user_api_url = process.env.USER_API_URL || false;
if (!user_api_url) {
	console.error("USER_API_URL environment variable is not set.");
	process.exit(1);
}

function Payload(username, id) {
	this.username = username;
	this.id = id;
}

function JWTgenerator(fastify, user) {
	const payload = Object.create(Payload);
	payload.username = user.username;
	payload.id = user.id;
	const token = fastify.jwt.sign({ payload });
	return token;
}

function User(username, email, password, token) {
	this.username = username;
	this.email = email;
	this.password = password;
	this.token = token;
	this.id = 0;
}


async function authRoute(fastify, options) {
	console.log("Auth route loaded");
	fastify.decorate("authenticate", async (request, reply) => {
		try {
			const token = request.cookies.token;
			if (!token) return reply.code(401).send({ error: "No cookies found" });
			const decoded = fastify.jwt.verify(token);
			request.user = decoded;
		} catch (e) {
			reply.send(e);
		}
	});

	fastify.get("/me",
		{ onRequest: [fastify.authenticate] },
		async (req, reply) => {
			const userId = req.user.payload.id;
			const r = await fetch(`${user_api_url}/${userId}`);
			if (!r.ok) {
				return reply.code(404).send({ error: "User not found" });
			}
			const profile = await r.json();
			return profile || reply.code(404).send({ error: "User not found" });
		}
	);


	fastify.post('/auth/signup', async function (request, reply) {
		try {
			const resId = await authController.signupUser(request, reply);
			if (!resId) {
				throw new Error();
			}
			const user = Object.create(User);
			user.username = await request.body.username;
			user.id = resId;
			user.token = JWTgenerator(fastify, user);
			reply.setCookie("token", user.token, {
				httpOnly: true,
				signed: false,
				secure: true,
				path: "/",
			});
			return reply.code(200).send({ ok: true, message: "Signup successful" });
		} catch (e) {
			console.error(e)
		}
	})

	fastify.post("/auth/signin", async function (request, reply) {
		try {
			const reqId = await authController.loginUser(request, reply);
			const username = await authController.getUsername(request, reply);
			const user = Object.create(User);

			if (!username || !reqId)
				return;

			user.email = await request.body.email;
			user.username = username;
			user.id = reqId;
			if (!user.id) {
				return reply.code(404).send({ error: "User ID not found" });
			}
			user.token = JWTgenerator(fastify, user);
			reply.setCookie("token", user.token, {
				httpOnly: true,
				signed: false,
				secure: true,
				path: "/",
			});

		} catch (e) {
			console.error(e);
		}
	});

	fastify.post("/auth/logout", async (req, rep) => {
		console.log("You've been Logged out")
		rep.clearCookie('token', { path: '/' });

		return rep.send({ message: 'Logged out successfully' });
	})

	fastify.post('/code', async (req, reply) => {
		const frontAuth = await req.body;

		const res = await authController.codeVerification(frontAuth);
		if (!res || !res.ok)
			return reply.code(404).send({ error: "Code verification failed" });
		return reply.code(200).send({ ok: true, message: "Code verified successfully" });
	});
	console.log("Auth routes registered");
}

module.exports = authRoute;
