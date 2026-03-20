import { signupUser, loginUser, getUsername, codeVerification, checkSignupAvailability } from '../controllers/authController.js'
import { createZohoTransporter } from '../services/authServices.js'
import { getUserByEmail } from '../controllers/authController.js';
import bcrypt from 'bcryptjs';
import React from "react";
import { render } from "@react-email/render";
import SigninEmail from "../mails/signinEmail.js";
import SignupEmail from "../mails/signupEmail.js";

const ERROR_CODES = {
	MISSING_FIELDS: { status: 400, message: 'Email and password are required' },
	PASSWORD_TOO_SHORT: { status: 400, message: 'Password must be at least 12 characters' },
	EMAIL_EXISTS: { status: 409, message: 'Email already exists' },
	USERNAME_TAKEN: { status: 409, message: 'Username already taken' },
	INVALID_CREDENTIALS: { status: 401, message: 'Invalid email or password' },
	DATABASE_READ_ONLY: { status: 503, message: 'Database is read-only' },
	DATABASE_BUSY: { status: 503, message: 'Database is temporarily unavailable' },
	DATABASE_ERROR: { status: 500, message: 'Internal server error' },
	DEFAULT: { status: 500, message: 'An unexpected error occurred' }
}

const subjectSignup = {
	"fr": "Bienvenue",
	"en": "Welcome",
	"ar": "مرحباً",
};

const subjectSignin = {
	"fr": "Bon retour",
	"en": "Welcome back",
	"ar": "مرحبًا بعودتك",
};

const user_api_url = process.env.USER_API_URL || false;
if (!user_api_url) {
	console.error("USER_API_URL environment variable is not set.");
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
	fastify.decorate("authenticate", async (request, reply) => {
		try {
			const token = request.cookies.token;
			if (!token) {
				return reply.code(401).send({ error: "No token" });
			}
			const decoded = fastify.jwt.verify(token);
			
			const res = await fetch(`${user_api_url}/users/${decoded.id}`);
			if (!res.ok) {
				reply.clearCookie("token", {
					path: "/",
					httpOnly: true,
					secure: true,
					sameSite: "lax"
				});
				return reply.code(401).send({ error: "User no longer exists" });
			}

			request.user = decoded;

		} catch (e) {
			return reply.code(401).send({ error: "Invalid token" });
		}
	});

	fastify.get("/me", async (req, reply) => {
		const token = req.cookies?.token;
		if (!token) {
			return reply.code(200).send({ authenticated: false });
		}

		let decoded;
		try {
			decoded = fastify.jwt.verify(token);
		} catch {
			return reply.code(200).send({ authenticated: false });
		}

		const userId = Number(decoded?.id);
		if (!Number.isInteger(userId) || userId <= 0) {
			return reply.code(200).send({ authenticated: false });
		}

		const r = await fetch(`${user_api_url}/users/${userId}`);
		if (!r.ok) {
			return reply.clearCookie("token", {
				path: "/",
				httpOnly: true,
				signed: false,
				secure: true,
			})
			.code(404)
			.send({ error: "User not found" });
		}

		const profile = await r.json();
		return profile || reply.clearCookie("token", {
					path: "/",
					httpOnly: true,
					signed: false,
					secure: true,
				})
				.code(404)
				.send({ error: "User not found" });
	});

	fastify.post("/signout",
		{ onRequest: [fastify.authenticate] },
		async (req, reply) => {
			return performSignout(req, reply);
		}
	);

	let usersCode = [];
	let pendingSignups = [];
	fastify.post('/signup/check', async function (request, reply) {
		try {
			const email = request.body?.email;
			const username = request.body?.username;
			const availability = await checkSignupAvailability(email, username);
			return reply.code(200).send({ success: true, ...availability });
		} catch (e) {
			if (e?.message === 'MISSING_FIELDS') {
				return reply.code(200).send({ success: true, emailAvailable: false, usernameAvailable: false });
			}
			return reply.code(200).send({ success: true, emailAvailable: true, usernameAvailable: true });
		}
	});

	fastify.post('/signup', async function (request, reply) {
		try {
			const email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			const username_regex = /^[\p{Script=Arabic}a-zA-Z0-9_]{3,16}$/u;
			const password_regex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*\W).{12,}$/;
			const email = await request.body.email;
			const username = await request.body.username;
			const password = await request.body.password;
			const hashPass = await bcrypt.hash(password, 12);
			const codeFound = usersCode.find((e) => e.email === email);
			const availability = await checkSignupAvailability(email, username);

			if (codeFound)
				usersCode = usersCode.filter((user) => user.email !== email);

			if (!email_regex.test(email))
				return reply.code(401).send({ success: false, error: 'Bad email format' });
			if (!password_regex.test(password))
				return reply.code(401).send({ success: false, error: 'Password must be 12+ chars, include an uppercase, a number, and a special character.' })
			else if (!username_regex.test(username))
				return reply.code(401).send({ success: false, error: 'Username should count between 3 & 16 characters and contains not any special characters' });

			if (!availability.emailAvailable) {
				return reply.code(409).send({
					success: false,
					error: ERROR_CODES.EMAIL_EXISTS.message,
					errorCode: 'EMAIL_EXISTS'
				});
			}

			if (!availability.usernameAvailable) {
				return reply.code(409).send({
					success: false,
					error: ERROR_CODES.USERNAME_TAKEN.message,
					errorCode: 'USERNAME_TAKEN'
				});
			}

			pendingSignups = pendingSignups.filter((pendingUser) => pendingUser.email !== email);
			pendingSignups.push({
				email,
				username,
				hashPass,
				createdAt: Date.now()
			});

			return reply.code(200).send({
				ok: true,
				requires2fa: true,
				user: {
					id: 0,
					username,
					email,
				},
				message: "Signup successful"
			});
		} catch (e) {
			let errorKey = e?.message;
			const rawError = String(e || '');
			const lower = rawError.toLowerCase();

			if (!ERROR_CODES[errorKey]) {
				if (rawError.includes('users.email')) errorKey = 'EMAIL_EXISTS';
				else if (rawError.includes('users.username')) errorKey = 'USERNAME_TAKEN';
				else if (lower.includes('readonly')) errorKey = 'DATABASE_READ_ONLY';
				else if (lower.includes('database is locked') || lower.includes('database is busy')) errorKey = 'DATABASE_BUSY';
			}

			const errorInfo = ERROR_CODES[errorKey] || ERROR_CODES.DEFAULT

			return reply.code(errorInfo.status).send({
				success: false,
				error: errorInfo.message,
				errorCode: errorKey || 'DEFAULT'
			})
		}
	})

	fastify.post("/signin", async function (request, reply) {
		try {
			const email = await request.body.email;
			const password = await request.body.password;
			const reqUser = await loginUser(email, password);
			const resolvedUserId = Number(reqUser?.id);
			const username = reqUser?.username || await getUsername(email);
			const codeFound = usersCode.find((e) => e.email === email);

			if (!Number.isInteger(resolvedUserId) || resolvedUserId <= 0) {
				return reply.code(200).send({ ok: false, success: false, error: 'Invalid user id' });
			}

			if (codeFound)
				usersCode = usersCode.filter((user) => user.email !== email);
			return reply.code(200).send({
				ok: true,
				requires2fa: true,
				user: {
					id: resolvedUserId,
					username,
					email,
				},
			});
		} catch (e) {
			const errorInfo = ERROR_CODES[e.message] || ERROR_CODES.DEFAULT;
			return reply.code(200).send({
				ok: false,
				success: false,
				error: errorInfo.message,
				errorCode: e?.message || 'DEFAULT'
			});
		}
	});

	fastify.post("/signin/mail", async function (request, reply) {
		try {
			const FIFTEEN_MIN = 15 * 60 * 1000;
			const transporter = createZohoTransporter();
			const { email, lang } = request.body;
			const user = await getUserByEmail(email);
			const codeValue = Math.floor(100000 + Math.random() * 900000);

			usersCode.push({
				email: email,
				code: codeValue.toString(),
				expireAt: Date.now() + FIFTEEN_MIN
			});
			const html = await render(React.createElement(SigninEmail, { username: user.username, code: codeValue, lang: lang }));
			await transporter.sendMail({
				from: `"ft_transcendence" <ft_trans@zohomail.eu>`,
				to: email,
				subject: subjectSignin[lang],
				html,
			})
			return reply.send({ success: true })
		} catch (e) {
			const errorInfo = ERROR_CODES[e.message] || ERROR_CODES.DEFAULT

			return reply.code(errorInfo.status).send({
				success: false,
				error: errorInfo.message
			})
		}
	});

	fastify.post("/signup/mail", async (request, reply) => {
		try {
			const FIFTEEN_MIN = 15 * 60 * 1000;
			const codeValue = Math.floor(100000 + Math.random() * 900000);
			const { username, email, lang } = request.body;
			const pendingSignup = pendingSignups.find((pendingUser) => pendingUser.email === email && pendingUser.username === username);

			if (!pendingSignup) {
				return reply.code(401).send({ success: false, error: "signup verification session not found" });
			}

			usersCode = usersCode.filter((user) => user.email !== email);
			usersCode.push({
				email: email,
				code: codeValue.toString(),
				expireAt: Date.now() + FIFTEEN_MIN
			});
			const html = await render(React.createElement(SignupEmail, { username: username, code: codeValue, lang: lang }));
			const transporter = createZohoTransporter();

			await transporter.sendMail({
				from: `"ft_transcendence" <ft_trans@zohomail.eu>`,
				to: email,
				subject: subjectSignup[lang]+`, ${username} !`,
				html,
			});

			return reply.send({ success: true });
		} catch (err) {
			const errorInfo = ERROR_CODES[e.message] || ERROR_CODES.DEFAULT

			return rep.code(errorInfo.status).send({
				success: false,
				error: errorInfo.message
			})
		}
	});

	fastify.post("/send", async (request, reply) => {
		try {
			const { username, email, lang } = request.body;
			const codeValue = Math.floor(100000 + Math.random() * 900000);
			const transporter = createZohoTransporter();
			const codeFound = usersCode.find((e) => e.email === email);
			const FIFTEEN_MIN = 15 * 60 * 1000;

			if (codeFound)
				usersCode = usersCode.filter((user) => user.email !== email);
			else {
				return reply.code(401).send({ success: false, error: "user doesn't exist" });
			}
			usersCode.push({
				email: email,
				code: codeValue.toString(),
				expireAt: Date.now() + FIFTEEN_MIN
			});
			const html = await render(React.createElement(SigninEmail, { username: username, code: codeValue, lang: lang }));
			await transporter.sendMail({
				from: `"ft_transcendence" <ft_trans@zohomail.eu>`,
				to: email,
				subject: subjectSignin[lang]+`, ${username} !`,
				html,
			});
		} catch (e) {
			const errorInfo = ERROR_CODES[e.message] || ERROR_CODES.DEFAULT

			return reply.code(errorInfo.status).send({
				success: false,
				error: errorInfo.message
			})
		}
	});

	fastify.post("/verify-2fa", async (req, rep) => {
		const code = await req.body.code;
		const email = await req.body.email;
		const codeFound = usersCode.find((e) => e.email === email);

		if (!code || !/^\d{6}$/.test(code.toString())) {
			return rep.code(200).send({ success: false, error: "invalid 6-digits code" });
		}

		if (!codeFound) {
			return rep.code(200).send({ success: false, error: "invalid 6-digits code" });
		}

		if (Date.now() > codeFound.expireAt) {
			usersCode = usersCode.filter((user) => user.email !== email);
			return rep.code(200).send({ success: false, error: "The code has expired. Please request a new one." });
		}

		if (codeFound.code === code.toString()) {
			usersCode = usersCode.filter((user) => user.email !== email);

			const pendingSignup = pendingSignups.find((pendingUser) => pendingUser.email === email);
			let resolvedUserId;
			let resolvedUsername;

			if (pendingSignup) {
				try {
					resolvedUserId = await signupUser(pendingSignup.email, pendingSignup.username, pendingSignup.hashPass);
					resolvedUsername = pendingSignup.username;
					pendingSignups = pendingSignups.filter((pendingUser) => pendingUser.email !== email);
				} catch (e) {
					let errorKey = e?.message;
					const rawError = String(e || '');
					if (rawError.includes('users.email')) errorKey = 'EMAIL_EXISTS';
					else if (rawError.includes('users.username')) errorKey = 'USERNAME_TAKEN';
					const errorInfo = ERROR_CODES[errorKey] || ERROR_CODES.DEFAULT;
					return rep.code(errorInfo.status).send({
						success: false,
						error: errorInfo.message,
						errorCode: errorKey || 'DEFAULT'
					});
				}
			} else {
				try
				{
					const verifiedUser = await getUserByEmail(email);
					resolvedUserId = Number(verifiedUser?.id);
					resolvedUsername = verifiedUser?.username;
				}
				catch(e) {
					return rep.code(200).send({ success: false, error: "User not found" });
				}
			}

			if (!Number.isInteger(Number(resolvedUserId)) || Number(resolvedUserId) <= 0 || !resolvedUsername) {
				return rep.code(200).send({ success: false, error: "invalid 6-digits code" });
			}

			const user = Object.create(User);
			user.email = email;
			user.username = resolvedUsername;
			user.id = Number(resolvedUserId);
			user.token = JWTgenerator(fastify, user);

			rep.setCookie("token", user.token, {
				httpOnly: true,
				signed: false,
				secure: true,
				path: "/",
			});

			return rep.code(200).send({
				success: true,
				user: {
					id: user.id,
					username: user.username,
					email: user.email,
				},
			});
		} else {
			return rep.code(200).send({ success: false, error: "invalid 6-digits code" });
		}
	})

	fastify.post("/logout", async (req, rep) => {
		try {
			await fastify.authenticate(req, rep);
			if (rep.sent) {
				return;
			}
			return performSignout(req, rep);
		} catch (e) {
			rep.clearCookie('token', { path: '/' });
			return rep.send({ message: 'Logged out successfully' });
		}
	})

	fastify.post('/code', async (req, reply) => {
		const frontAuth = await req.body;

		const res = await codeVerification(frontAuth);
		if (!res || !res.ok)
			return reply.code(404).send({ error: "Code verification failed" });
		return reply.code(200).send({ ok: true, message: "Code verified successfully" });
	});
}

export { authRoute };
