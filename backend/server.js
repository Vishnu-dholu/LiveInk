import { JWT_SECRET, CLIENT_URL, PORT } from "./config/env.js"; // must load first (dotenv)
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import jwt from "jsonwebtoken";
import passport from "passport";
import authRoutes from "./routes/authRoutes.js";
import oauthRoutes from "./routes/oauthRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import initializePassport from "./config/passport.js";
import { runMigrations } from "./migrate.js";
import {
  createRoom,
  getRoomMembers,
  joinRoom,
  leaveRoom,
  getRoomCreatorUsernameInMemory,
  getRoomCreatorUsername,
  getCanvasSnapshot,
  applyCanvasOps,
  flushAllCanvases,
  getUsernameById,
  saveMessage,
  getRoomMessages,
} from "./services/roomService.js";

const MAX_MESSAGE_LENGTH = 2000;
// Largest accepted socket payload (a long freehand stroke can be a few hundred KB)
const MAX_PAYLOAD_BYTES = 2 * 1024 * 1024;
// Per-socket event budget: refills EVENTS_PER_SECOND tokens/s up to EVENT_BURST
const EVENTS_PER_SECOND = 200;
const EVENT_BURST = 400;

initializePassport();

const app = express();
if (process.env.TRUST_PROXY) app.set("trust proxy", Number(process.env.TRUST_PROXY) || 1);

const server = createServer(app);
const io = new Server(server, {
  maxHttpBufferSize: MAX_PAYLOAD_BYTES,
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(passport.initialize());

app.use("/api/auth", authRoutes);
app.use("/auth", oauthRoutes);
app.use("/api/rooms", roomRoutes);

// Authenticate the socket and load the real identity from the database
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Authentication error: No token provided"));

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const username = await getUsernameById(decoded.id);
    if (!username) return next(new Error("Authentication error: User not found"));

    socket.userId = decoded.id;
    socket.username = username;
    next();
  } catch (err) {
    next(new Error("Authentication error: Invalid token"));
  }
});

// Removes the socket from its room; the user stays listed if another tab is still connected
async function removeFromRoom(socket) {
  const { roomId, userId } = socket;
  if (!roomId) return;

  socket.roomId = null;
  socket.leave(roomId);

  const remaining = await io.in(roomId).fetchSockets();
  if (remaining.some((s) => s.userId === userId)) return;

  const updatedUsers = leaveRoom(roomId, userId);
  io.to(roomId).emit("room:members", {
    members: updatedUsers,
    createdBy: getRoomCreatorUsernameInMemory(roomId),
  });
}

io.on("connection", (socket) => {
  // Drop events from clients that flood the connection
  let tokens = EVENT_BURST;
  let lastRefill = Date.now();
  socket.use((packet, next) => {
    const now = Date.now();
    tokens = Math.min(EVENT_BURST, tokens + ((now - lastRefill) / 1000) * EVENTS_PER_SECOND);
    lastRefill = now;
    if (tokens < 1) return;
    tokens -= 1;
    next();
  });

  const reply = (callback, payload) => {
    if (typeof callback === "function") callback(payload);
  };

  // Create room
  socket.on("room:create", async ({ roomName, password } = {}, callback) => {
    try {
      const roomId = await createRoom(socket.userId, roomName, password);
      reply(callback, { success: true, roomId });
    } catch (err) {
      reply(callback, { success: false, message: err.message });
    }
  });

  // Join a room (identity comes from the verified token, never from the payload)
  socket.on("room:join", async ({ roomId, password } = {}, callback) => {
    try {
      const users = await joinRoom(roomId, socket.userId, password, socket.username);

      if (socket.roomId && socket.roomId !== roomId) await removeFromRoom(socket);
      socket.join(roomId);
      socket.roomId = roomId;

      const [history, creatorUsername] = await Promise.all([
        getRoomMessages(roomId),
        getRoomCreatorUsername(roomId),
      ]);
      const members = users.map((u) => ({ userId: u.userId, username: u.username }));

      socket.to(roomId).emit("user-joined", { userId: socket.userId, username: socket.username });
      io.to(roomId).emit("room:members", { members, createdBy: creatorUsername });

      reply(callback, {
        success: true,
        users: members,
        createdBy: creatorUsername,
        history,
        canvasState: getCanvasSnapshot(roomId),
      });
    } catch (err) {
      reply(callback, { success: false, message: err.message });
    }
  });

  socket.on("room:members", ({ roomId } = {}, callback) => {
    if (!roomId || roomId !== socket.roomId) {
      return reply(callback, { success: false, message: "Not in this room" });
    }
    reply(callback, { success: true, members: getRoomMembers(roomId) });
  });

  socket.on("leave-room", () => {
    removeFromRoom(socket).catch((err) => console.error("leave-room failed:", err));
  });

  socket.on("room:message", async ({ message } = {}) => {
    const roomId = socket.roomId;
    const text = typeof message?.text === "string" ? message.text.trim() : "";
    if (!roomId || !text || text.length > MAX_MESSAGE_LENGTH) return;

    // Author and time are set by the server so they cannot be spoofed
    const chatMessage = { username: socket.username, text, timestamp: Date.now() };
    try {
      await saveMessage(roomId, chatMessage.username, chatMessage.text, chatMessage.timestamp);
      io.to(roomId).emit("room:message", chatMessage);
    } catch (err) {
      console.error("Error saving room message:", err);
    }
  });

  // Ephemeral previews: relayed only, never stored
  socket.on("draw:live", (payload) => {
    if (socket.roomId) socket.to(socket.roomId).emit("draw:live", payload);
  });

  socket.on("shape:live", (payload) => {
    if (socket.roomId) socket.to(socket.roomId).emit("shape:live", payload);
  });

  // Persistent canvas changes arrive as small deltas (add / update / remove / clear by id)
  socket.on("canvas:ops", (ops) => {
    const roomId = socket.roomId;
    if (!roomId) return;

    const applied = applyCanvasOps(roomId, ops);
    if (applied.length > 0) socket.to(roomId).emit("canvas:ops", applied);
  });

  socket.on("disconnect", () => {
    removeFromRoom(socket).catch((err) => console.error("disconnect cleanup failed:", err));
  });
});

async function shutdown() {
  console.log("Shutting down, saving canvases...");
  await flushAllCanvases();
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

runMigrations()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Startup failed:", err);
    process.exit(1);
  });
