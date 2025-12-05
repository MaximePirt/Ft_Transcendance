'use strict'

import fastify from "fastify";
import userRoutes from "../../user/src/routes/userRoute.js";

function build(opts={}) {
    const app = fastify(opts);
    userRoutes();
    return app;
}

module.exports = build;