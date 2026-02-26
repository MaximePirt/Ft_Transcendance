import { signupUser, loginUser, getUsername, codeVerification } from '../controllers/authController.js'
import { createZohoTransporter } from '../services/authServices.js'
import React from "react";
import { render } from "@react-email/render";
import SigninEmail from "../mails/signinEmail.js";
import SignupEmail from "../mails/signupEmail.js"
import bcrypt from 'bcryptjs';

const ERROR_CODES = {
	MISSING_FIELDS: { status: 400, message: 'Email and password are required' },
	PASSWORD_TOO_SHORT: { status: 400, message: 'Password must be at least 8 characters' },
	EMAIL_EXISTS: { status: 409, message: 'Email already exists' },
	INVALID_CREDENTIALS: { status: 401, message: 'Invalid email or password' },
	DATABASE_ERROR: { status: 500, message: 'Internal server error' },
	DEFAULT: { status: 500, message: 'An unexpected error occurred' }
}

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

	let usersCode = [];
	fastify.post('/signup', async function (request, reply) {
		try {
			const password_regex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{12,}$/;
			const email = await request.body.email;
			const username = await request.body.username;
			const password = await request.body.password;
			const hashPass = await bcrypt.hash(password, 12);
			console.log("username: ", username, " email: ", email, " password: ", hashPass);
			const newReq = JSON.stringify({
				username,
				email,
				password: hashPass
			});
			if (!password_regex.test(password))
				return reply.code(401).send({ error: 'Password must be 12+ chars, include an uppercase, a number, and a special character.' })
			const resId = await signupUser(newReq, reply);
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

	fastify.post("/signin", async function (request, reply) {
		try {
			console.log("user: ", request.body);
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

	fastify.post("/signin/mail", async function (req, rep) {
		try {
			const FIFTEEN_MIN = 15 * 60 * 1000;
			const transporter = createZohoTransporter();
			const email = await req.body.email;
			const user = await getUserByEmail(email);
			let codeValue = 0;

			console.log("user from db: ", user);
			for (let i = 0; i < 6; i++) {
				codeValue *= 10;
				codeValue += (Math.floor(Math.random() * 10));
			}
			usersCode.push({
				email: email,
				code: codeValue.toString(),
				expireAt: Date.now() + FIFTEEN_MIN
			});
			const html = await render(React.createElement(SigninEmail, { username: 'toto', code: codeValue }));
			await transporter.sendMail({
				from: `"ft_transcendence" <ft_trans@zohomail.eu>`,
				to: "thi.dausque@gmail.com",
				//to: user.email,
				subject: `Hello toto !`,
				html,
			})
			return rep.send({ success: true })
		} catch (e) {
			console.error('signin/email error: ', e.message);
			const errorInfo = ERROR_CODES[e.message] || ERROR_CODES.DEFAULT

			return rep.code(errorInfo.status).send({
				success: false,
				error: errorInfo.message
			})
		}
	});

	fastify.post("/signup/mail", async (request, reply) => {
		try {
			const FIFTEEN_MIN = 15 * 60 * 1000;
			let codeValue = 0;
			const username = await request.body.username;
			const email = await request.body.email;
			for (let i = 0; i < 6; i++) {
				codeValue *= 10;
				codeValue += (Math.floor(Math.random() * 10));
			}
			usersCode.push({
				email: email,
				code: codeValue.toString(),
				expireAt: Date.now() + FIFTEEN_MIN
			});
			const html = await render(React.createElement(SignupEmail, { username: username, code: codeValue }));
			const transporter = createZohoTransporter();

			await transporter.sendMail({
				from: `"ft_transcendence" <ft_trans@zohomail.eu>`,
				to: "thi.dausque@gmail.com",
				//to: user.email,
				subject: `Welcome, ${username} !`,
				html,
			});

			return reply.send({ success: true });
		} catch (err) {
			console.error(err);
			return reply.code(500).send({ error: "MAIL_FAILED" });
		}
	});

	fastify.post("/verify-2fa", async (req, rep) => {
		const code = await req.body.code;
		const username = await req.body.username;
		const email = await req.body.email;
		const codeFound = usersCode.find((e) => e.email === email);

		if (Date.now() > codeFound.expireAt) {
			usersCode = usersCode.filter((user) => user.email !== email);
			return rep.code({
				error: "The code has expired. Please request a new one."
			});
		}

		if (codeFound && codeFound.code === code.toString()) {
			return rep.send({ success: true });
		} else {
			return rep.code(401).send({ success: false, error: "invalid 6-digits code" });
		}
	})

	fastify.post("/logout", async (req, rep) => {
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
