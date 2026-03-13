import { signupUser, loginUser, getUsername, getUserId, getUserAuth, checkUser } from '../controllers/authController.js'
import { createZohoTransporter } from '../services/authServices.js'
import React from "react";
import { render } from "@react-email/render";
import SigninEmail from "../mails/signinEmail.js";
import SignupEmail from "../mails/signupEmail.js";
import { changeUserAuth } from '../controllers/authController.js';
import bcrypt from 'bcryptjs';

const ERROR_CODES = {
	MISSING_FIELDS: { status: 400, message: 'Email and password are required' },
	PASSWORD_TOO_SHORT: { status: 400, message: 'Password must be at least 12 characters' },
	EMAIL_EXISTS: { status: 409, message: 'Email or username already exists' },
	INVALID_CREDENTIALS: { status: 401, message: 'Invalid email or password' },
	DATABASE_ERROR: { status: 500, message: 'Internal server error' },
	DEFAULT: { status: 500, message: 'An unexpected error occurred' }
}

const user_api_url = process.env.AUTH_API_URL || false;
if (!user_api_url) {
	console.error("AUTH_API_URL environment variable is not set.");
	process.exit(1);
}

function JWTgenerator(fastify, user) {
	return fastify.jwt.sign({
		username: user.username,
		id: user.id
	});
}

function User(username, email, password, token) {
	this.username = username;
	this.email = email;
	this.password = password;
	this.token = token;
	this.id = 0;
}

async function performSignout(req, reply) {
	try {
		const userId = req.user.id;
		const cookieHeader = req.headers.cookie;
		const offlineRes = await fetch(`${user_api_url}/${userId}`, {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
				...(cookieHeader ? { cookie: cookieHeader } : {}),
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
			const userId = req.user.id;
			const r = await fetch(`${user_api_url}/users/${userId}`);
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
			return performSignout(req, reply);
		}
	);

	let usersCode = [];
	let users = new Map();
	fastify.post('/signup', async function (request, reply) {
		try {
			const email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			const username_regex = /^[a-zA-Z0-9_]{3,16}$/;
			const password_regex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{12,}$/;
			const email = await request.body.email;
			const username = await request.body.username;
			const password = await request.body.password;
			const hashPass = await bcrypt.hash(password, 12);
			const codeFound = usersCode.find((e) => e.email === email);

			users.set(email, { email, username, password: hashPass });
			if (codeFound)
				usersCode = usersCode.filter((user) => user.email !== email);

			if (!password_regex.test(password))
				return reply.code(401).send({ success: false, error: 'Password must be 12+ chars, include an uppercase, a number, and a special character.' })
			else if (!username_regex.test(username))
				return reply.code(401).send({ success: false, error: 'Username should count between 3 & 16 characters and contains not any special characters' });
			else if (!email_regex.test(email))
				return reply.code(401).send({ success: false, error: 'Bad email format' });
			signUpMail(email, username);

			if (!await checkUser(email, username))

				return reply.code(200).send({ ok: true, message: "Signup successful" });
		} catch (e) {
			console.error(e.message);
			const errorInfo = ERROR_CODES[e.message] || ERROR_CODES.DEFAULT;

			return reply.code(errorInfo.status).send({
				success: false,
				error: errorInfo.message
			})
		}
	})

	fastify.post("/signin", async function (request, reply) {
		try {
			const email = await request.body.email;
			const password = await request.body.password;
			const reqUser = await loginUser(email, password);
			const resolvedUserId = Number(reqUser);
			const username = reqUser?.username || await getUsername(email);
			const user = Object.create(User);
			const codeFound = usersCode.find((e) => e.email === email);
			const isAuth = await getUserAuth(email);

			console.log("User Id: ", resolvedUserId, " - ", reqUser);

			if (!Number.isInteger(resolvedUserId) || resolvedUserId <= 0) {
				return reply.code(500).send({ success: false, error: 'Invalid user id' });
			}

			if (codeFound)
				usersCode = usersCode.filter((user) => user.email !== email);

			user.email = await request.body.email;
			user.username = username;
			user.id = resolvedUserId;
			user.token = JWTgenerator(fastify, user);

			if (isAuth === 1)
				signInMail(email, username);
			else {
				reply.setCookie("token", user.token, {
					httpOnly: true,
					signed: false,
					secure: true,
					path: "/",
				});
			}
			return reply.code(200).send({
				ok: true,
				user: {
					id: user.id,
					username: user.username,
					email: user.email,
					isAuth: isAuth ? 1 : 0
				},
			});
		} catch (e) {
			console.error(e);
			const errorInfo = ERROR_CODES[e.message] || ERROR_CODES.DEFAULT;
			return reply.code(errorInfo.status).send({
				success: false,
				error: errorInfo.message
			});
		}
	});

	async function signInMail(email, username) {
		try {
			const FIFTEEN_MIN = 15 * 60 * 1000;
			const transporter = createZohoTransporter();
			const codeValue = Math.floor(100000 + Math.random() * 900000);

			usersCode.push({
				email: email,
				code: codeValue.toString(),
				expireAt: Date.now() + FIFTEEN_MIN
			});
			const html = await render(React.createElement(SigninEmail, { username: username, code: codeValue }));
			await transporter.sendMail({
				from: `"ft_transcendence" <ft_trans@zohomail.eu>`,
				to: email,
				//to: user.email,
				subject: `Hello ${username} !`,
				html,
			})
		} catch (e) {
			throw new Error("DEFAULT");
		}
	}

	async function signUpMail(email, username) {
		try {
			const FIFTEEN_MIN = 15 * 60 * 1000;
			const codeValue = Math.floor(100000 + Math.random() * 900000);

			usersCode.push({
				email: email,
				code: codeValue.toString(),
				expireAt: Date.now() + FIFTEEN_MIN
			});
			const html = await render(React.createElement(SignupEmail, { username: username, code: codeValue }));
			const transporter = createZohoTransporter();

			await transporter.sendMail({
				from: `"ft_transcendence" <ft_trans@zohomail.eu>`,
				to: email,
				//to: user.email,
				subject: `Welcome, ${username} !`,
				html,
			});
		} catch (err) {
			throw new Error("DEFAULT");
		}
	}

	fastify.post("/send", async (req, rep) => {
		try {
			const username = await req.body.username;
			const email = await req.body.email;
			const codeValue = Math.floor(100000 + Math.random() * 900000);
			const transporter = createZohoTransporter();
			const codeFound = usersCode.find((e) => e.email === email);
			const FIFTEEN_MIN = 15 * 60 * 1000;

			if (codeFound)
				usersCode = usersCode.filter((user) => user.email !== email);
			else {
				return rep.code(401).send({ success: false, error: "user doesn't exist" });
			}
			usersCode.push({
				email: email,
				code: codeValue.toString(),
				expireAt: Date.now() + FIFTEEN_MIN
			});
			const html = await render(React.createElement(SigninEmail, { username: username, code: codeValue }));
			await transporter.sendMail({
				from: `"ft_transcendence" <ft_trans@zohomail.eu>`,
				to: email,
				//to: user.email,
				subject: `Hey, ${username} !`,
				html,
			});
		} catch (e) {
			console.error(e);
			const errorInfo = ERROR_CODES[e.message] || ERROR_CODES.DEFAULT

			return rep.code(errorInfo.status).send({
				success: false,
				error: errorInfo.message
			})
		}
	});

	fastify.post("/verify-2fa", async (req, rep) => {
		const code = await req.body.code;
		const username = await req.body.username;
		const email = await req.body.email;
		const userId = await getUserId(email);
		const codeFound = usersCode.find((e) => e.email === email);
		const user = Object.create(User);
		try {
			if (!code)
				return;
			console.log(req.body);
			if (Date.now() > codeFound.expireAt) {
				console.error("error: code expired");
				usersCode = usersCode.filter((user) => user.email !== email);
				return rep.code(401).send({
					error: "The code has expired. Please request a new one.",
					success: false
				});
			}

			if (codeFound && codeFound.code === code.toString()) {
				console.log("OK: valid authentication code");
				if (users.has(email)) {
					const data = users.get(email);
					console.log("users data: ", data);
					const signUpId = signupUser(data.email, data.username, data.password);
					user.id = signUpId;
					users.delete(email);
				} else {
					user.id = userId;
				}
				user.email = email;
				user.username = username;
				user.token = JWTgenerator(fastify, user);

				usersCode = usersCode.filter((user) => user.email !== email);
				rep.setCookie("token", user.token, {
					httpOnly: true,
					signed: false,
					secure: true,
					path: "/",
				});
				return rep.code(200).send({ success: true });
			} else {
				console.log("error: bad code")
				return rep.code(401).send({ success: false, error: "invalid 6-digits code" });
			}
		} catch (e) {
			console.error(e);
			const errorInfo = ERROR_CODES[e.message] || ERROR_CODES.DEFAULT

			return rep.code(errorInfo.status).send({
				success: false,
				error: errorInfo.message
			})
		}
	})

	fastify.post("/logout", async (req, rep) => {
		try {
			await fastify.authenticate(req, rep);
			if (rep.sent) {
				return;
			}
			console.log("You've been Logged out")
			return performSignout(req, rep);
		} catch (e) {
			rep.clearCookie('token', { path: '/' });
			return rep.send({ message: 'Logged out successfully' });
		}
	})

	fastify.post("/handleFA", async (req, rep) => {

		try {
			const value = await req.body.auth;
			const email = await req.body.email;
			const changeAuth = await changeUserAuth(email, value);

			console.log(await req.body);
			if (changeAuth)
				return rep.code(200).send({ success: true });
		} catch (e) {
			console.error(e);
			const errorInfo = ERROR_CODES[e.message] || ERROR_CODES.DEFAULT

			return rep.code(errorInfo.status).send({
				success: false,
				error: errorInfo.message
			})
		}
	})

	fastify.get("/getUserAuth", async (req, rep) => {
		try {
			const email = await req.query.email;
			const value = await getUserAuth(email);

			if (value)
				return rep.code(200).send({ success: true, value: value });
		} catch (e) {
			console.error(e);
			const errorInfo = ERROR_CODES[e.message] || ERROR_CODES.DEFAULT

			return rep.code(errorInfo.status).send({
				success: false,
				error: errorInfo.message
			})
		}
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
