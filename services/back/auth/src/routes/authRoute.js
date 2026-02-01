authController = require("../controllers/authController");

const user_api_url = process.env.USER_API_URL || false;
if (!user_api_url) {
	console.error("USER_API_URL environment variable is not set.");
	process.exit(1);
}


function Payload(username) {
	this.username = username;
}

function JWTgenerator(user) {
	const payload = Object.create(Payload);
	payload.username = user.username;
	payload.id = user.id;
	const token = fastify.jwt.sign({ payload });
	return token;
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


	fastify.post('/signup', async function (request, reply) {
		console.log("Signup route called");
		const res = await authController.signupUser(request, reply);
		if (!res || !res.ok)
		{
			return reply.code(404).send({ error: "Signup failed" });
		}
		console.log("user sign up !");
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
		user.id = await getId(user.username);
		if (!user.id) {
			return reply.code(404).send({ error: "User ID not found" });
		}
		user.token = JWTgenerator(user);
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