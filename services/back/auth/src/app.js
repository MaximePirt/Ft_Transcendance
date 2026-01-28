"use strict";
const fastify = require("fastify")({ logger: true });
fastify.register(require("@fastify/multipart"));
fastify.register(require("./routes/authRoute"));


fastify.register(require("@fastify/cors"), {
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
fastify.register(require("@fastify/jwt"), {
  secret: "a-string-secret-at-least-256-bits-long",
});
fastify.register(require("@fastify/cookie"), {
  secret: "a-string-secret-at-least-256-bits-long",
  parseOptions: {},
  maxAge: 60_000,
});


const ejs = require("ejs");

fastify.register(require("@fastify/view"), {
  engine: { ejs},
  root: '/app/src/template',
});


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
