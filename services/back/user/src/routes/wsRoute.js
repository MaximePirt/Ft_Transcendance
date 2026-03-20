const friendWsHub = require("../ws/friendWsHub");
const logoutWsHub = require("../ws/logoutWsHub");

const AUTH_URL = process.env.AUTH_API_URL || false;
if (!AUTH_URL) {
  console.error("AUTH_API_URL environment variable is not set.");
  process.exit(1);
}

async function resolveAuthenticatedUserId(req) {
  const decodedId = Number(req?.user?.id);
  if (Number.isInteger(decodedId) && decodedId > 0) return decodedId;

  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;

  try {
    const meRes = await fetch(`${AUTH_URL}/me`, {
      method: "GET",
      headers: { cookie: cookieHeader },
    });
    if (!meRes.ok) return null;

    const me = await meRes.json();
    const meId = Number(me?.id);
    if (!Number.isInteger(meId) || meId <= 0) return null;
    return meId;
  } catch {
    return null;
  }
}

module.exports = async function wsRoutes(fastify) {
  fastify.get("/ws/friends", { preHandler: fastify.authenticate, websocket: true }, async (socket, req) => {
    const meId = await resolveAuthenticatedUserId(req);
    if (!meId) {
      socket.send(JSON.stringify({ type: "error", payload: "Unauthorized" }));
      socket.close(1008, "Unauthorized");
      return;
    }

    friendWsHub.add(meId, socket);
    socket.send(JSON.stringify({ type: "connected", payload: { ok: true } }));

    socket.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg?.type === "activity") {
          friendWsHub.markActivity(meId);
        }
      } catch {
        return;
      }
    });

    socket.on("close", () => {
      friendWsHub.remove(meId, socket);
    });
  });

  fastify.get("/ws/logout", { websocket: true }, async (socket, req) => {
    const meId = await resolveAuthenticatedUserId(req);
    if (!meId) {
      socket.send(JSON.stringify({ type: "error", payload: "Unauthorized" }));
      socket.close(1008, "Unauthorized");
      return;
    }

    logoutWsHub.add(meId, socket);
    socket.send(JSON.stringify({ type: "connected", payload: { ok: true } }));
    socket.on("close", () => {
      logoutWsHub.remove(meId, socket);
    });
  });
};