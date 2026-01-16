import Fastify from 'fastify'
import cors from '@fastify/cors'
import bcrypt from 'bcryptjs'
import jwt from '@fastify/jwt'
import cookie from '@fastify/cookie'
import view from '@fastify/view'
import nodemailer from 'nodemailer'
import ejs from 'ejs'

//TODO: Modificate by env variables
// const user_api_url = "http://user_api:3001";
const user_api_url = process.env.USER_API_URL || false;
if (!user_api_url) {
  console.error("USER_API_URL environment variable is not set.");
  process.exit(1);
}


async function getId(username) {
  const res = await fetch(`${user_api_url}/me_id`, {
    method: "GET",
    headers: {
      username: username,
      "Content-Type": "application/json",
    },
    credentials: "include",
    onRequest: fastify.authenticate,
  })
    .then((res) => res.json())
    .then((data) => data.id);
  return res;
}

const fastify = Fastify();
await fastify.register(cors, {
	origin: [
		'http://localhost/',
		'http://user_api:3001',
	],
	cookie: {
		cookieName: 'token',
		signed: false
	},
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
	credentials: true,
	allowedHeaders: ['Content-type', 'Authorization'],
})
//TODO: URGENT : MODIFY SECRET AND PUT IT IN ENV
await fastify.register(jwt, {
  secret: "a-string-secret-at-least-256-bits-long",
});
await fastify.register(cookie, {
  secret: "a-string-secret-at-least-256-bits-long",
  parseOptions: {},
  maxAge: 60_000,
});

await fastify.register(view, {
	engine: { ejs },
	root: '/app/src/template',
});

const saltWorkFactor = 12;
let facode = 0;

fastify.get("/", async function (request, reply) {
  console.log("Hello world !");
});

function User(username, email, password, token) {
  this.username = username;
  this.email = email;
  this.password = password;
  this.token = token;
  this.id = 0;
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

fastify.decorate("authenticate", async (request, reply) => {
  try {
    const token = request.cookies.token;
    if (!token) return reply.code(401).send({ error: "None cookies found :(" });
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
    console.log("Authenticated user ID:", userId);
    const r = await fetch(`${user_api_url}/${userId}`);
    if (!r.ok) {
      return reply.code(404).send({ error: "User not found" });
    }
    const profile = await r.json();
    return profile || reply.code(404).send({ error: "User not found" });
  }
);


fastify.post('/signup', async function (request, reply) {
	const user = Object.create(User);
	user.username = await request.body.username;
	user.email = await request.body.email;
	const pass = await request.body.password;
	user.password = await bcrypt.hash(request.body.password, saltWorkFactor);
	try {
		const transporter = nodemailer.createTransport({
			host: 'smtp.ethereal.email',
			port: 587,
			auth: {
        		user: user.email,
        		pass: pass
			}
		});
		const response = await fetch(`${user_api_url}/signup`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				username: user.username,
				email: user.email,
				password: user.password
			})
		});
		if (response.ok) {
			facode = Math.random() * (999999 - 100000) + 100000;
			(async () => {
				const info = await transporter.sendMail({
					from: '"toto" <ft_trans@ethereal.email>',
					to: user.email,
					subject: "Your authentication code ✔",
					html: `<b>Hello ${user.username}, here is your code: ${Math.round(facode)}</b>`
				});
				console.log("📨 Message sent:", user.email);
				console.log("🔗 Message received:", nodemailer.getTestMessageUrl(info))
			})();
		} else {
			const errmsg = await response.json();
			return reply.code(404).send(errmsg);
		}
	} catch (error) {
		console.error(error);
	}
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
      console.log(response);
      console.log("error status: ", response.status);
      console.log("error message: ", errmsg);
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
	const code = Math.round(facode);
	console.log("front authentication:", frontAuth);
	console.log("back authentication:", code.toString());
	if (code != frontAuth)
		return reply.code(404).send({ err: "Bad authentication code" });
})

const start = async () => {

  try {
    await fastify.listen({ port: 3003, host: "auth_api" });
    console.log("Auth server listening on port 3003");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
