authController = require("../controllers/authController");

const user_api_url = process.env.USER_API_URL || false;
if (!user_api_url) {
	console.error("USER_API_URL environment variable is not set.");
	process.exit(1);
}


function Payload(username) {
	this.username = username;
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

	fastify.post("/signout",
	{ onRequest: [fastify.authenticate] },
	async (req, reply) => {
		try {
			const userId = req.user.payload.id;
			const offlineRes = await fetch(`${user_api_url}/${userId}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ onlineStatus: 0 }),
			});

			reply.clearCookie("token", {
				path: "/",
				httpOnly: true,
				signed: false,
				secure: true,
			});

			if (!offlineRes.ok) {
				return reply.code(200).send({ ok: true, message: "Signed out, offline update failed" });
			}

			return reply.code(200).send({ ok: true, message: "Signed out" });
		} catch (e) {
			reply.clearCookie("token", {
				path: "/",
				httpOnly: true,
				signed: false,
				secure: true,
			});
			return reply.code(200).send({ ok: true, message: "Signed out" });
		}
	}
	);


	fastify.post('/signup', async function (request, reply) {
		const res = await authController.signupUser(request, reply);
		if (!res || !res.ok)
		{
			return reply.code(404).send({ error: "Signup failed" });
		}
		return reply.code(200).send({ ok: true, message: "Signup successful" });
	})

	fastify.post("/signin", async function (request, reply) {
	try {
		const response = await fetch(`${user_api_url}/signin`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
			body: JSON.stringify(request.body),
			onRequest: fastify.authenticate,
		});
		if (!response.ok) {
		const errmsg = await response.json();
		return reply.code(404).send(errmsg);
		}
		else
			console.log("user sign in !");
		const user = Object.create(User);
		user.username = await request.body.username;
		user.id = await fetch(`${user_api_url}/userid/${user.username}`).then(res => res.json()).then(data => data.id);
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

	fastify.post('/code', async (req, reply) => {
		const frontAuth = await req.body;

		const res = await authController.codeVerification(frontAuth);
		if (!res || !res.ok)
			return reply.code(404).send({ error: "Code verification failed" });
		return reply.code(200).send({ ok:true, message: "Code verified successfully"});
	});
	console.log("Auth routes registered");

}

module.exports = authRoute;