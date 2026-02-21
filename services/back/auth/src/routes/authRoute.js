import { signupUser, loginUser, getUsername, codeVerification } from '../controllers/authController.js'
import qrcode from "qrcode"
import bcrypt from 'bcryptjs';
import speakeasy from "speakeasy"

const { authenticator } = pkg;
const users = {};
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

export default async function authRoute(fastify, options) {
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

	function generateBackupCodes() {
		const codes = [];
		for (let i = 0; i < 10; i++) {
			codes.push(crypto.randomBytes(4).toString("Hex"));
		}
		return codes;
	}

	const users = {}
	fastify.post('/auth/signup', async function (request, reply) {
		try {
			const password_regex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{12,}$/;
			const email = await request.body.email;
			const username = await request.body.username;
			const password = await request.body.password;
			const hashPass = await bcrypt.hash(password, 12);
			const newReq = JSON.stringify({
				username: username,
				email: email,
				password: hashPass
			})
			if (!password_regex.test(request.body.password))
				return reply.code(401).send({ error: 'Password must be 12+ chars, include an uppercase, a number, and a special character.' })
			const resId = await signupUser(newReq, reply);
			if (!resId) {
				throw new Error();
			}
			const secret = authenticator.generateSecret();
			const backupCodes = generateBackupCodes();
			users[username] = { password: hashPass, secret, backupCodes };

			qrcode.toDataURL(
				optlib.authenticator.keyuri(username, "ft_trans", secret),
				(err, imageUrl) => {
					if (err) {
						return reply.status(500).send("Error generating QR code");
					}
					res.send({ secret, imageUrl })
				},
			);

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
			const reqId = await loginUser(request, reply);
			const username = await getUsername(request, reply);
			const email = await request.body.email;
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

	fastify.post("verify-2fa", (req, rep) => {
		const { username, token } = req.body;
		const user = users[username];

		if (!user) {
			return res.status(400).send("User not found");
		}

		const isValid = authenticator.check(token, user.secret);
		if (!isValid) {
			const backupCodeIndex = user.backupCodes.indexOf(token);
			if (backupCodeIndex === -1) {
				return rep.status(401).send("Invalid 2FA token or backup code");
			}
			user.backupCodes.splice(backupCodeIndex, 1);
		}
		return rep.send("2FA verification successfull");
	})

	fastify.post("/auth/logout", async (req, rep) => {
		console.log("You've been Logged out")
		rep.clearCookie('token', { path: '/' });

		return rep.send({ message: 'Logged out successfully' });
	})

	fastify.post('/code', async (req, reply) => {
		const frontAuth = await req.body;

		const res = await codeVerification(frontAuth);
		if (!res || !res.ok)
			return reply.code(404).send({ error: "Code verification failed" });
		return reply.code(200).send({ ok: true, message: "Code verified successfully" });
	});
	console.log("Auth routes registered");
}

export { authRoute };
