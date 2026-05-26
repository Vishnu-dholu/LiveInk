import express from "express";
import { createServer } from "http"; //  Create an HTTP server
import { Server } from "socket.io"; // Import Socket.IO for WebSocket communication
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import oauthRoutes from "./routes/oauthRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import jwt from "jsonwebtoken";
import pool from "./db.js";
import initializePassport from "./config/passport.js";
import session from "express-session";
import passport from "passport";
import {
  createRoom,
  getRoomMembers,
  joinRoom,
  getRooms,
  leaveRoom,
  getRoomCreatorUsernameInMemory,
  getRoomCreatorUsername,
  saveCanvasState,
  getRoomCanvasState,
  saveMessage,
  getRoomMessages,
} from "./services/roomService.js";

dotenv.config();
initializePassport();

const app = express(); //  Initialize Express.js app
const rooms = getRooms();

app.use(
  session({
    secret: process.env.SESSION_SECRET || "some_secret",
    resave: false,
    saveUninitialized: false,
  }),
);

const server = createServer(app); //  Create an HTTP server
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173", // Allow connections from the frontend
    methods: ["GET", "POST"], // Allow GET and POST requests
    credentials: true,
  },
});

//  Middleware to enable CORS and JSON parsing
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());

app.use("/api/auth", authRoutes);
app.use("/auth", oauthRoutes);
app.use("/api/rooms", roomRoutes);

const JWT_SECRET = process.env.JWT_SECRET || "Your_secret_key";

io.use((socket, next) => {
  // Look for token in auth payload or headers
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("Authentication error: No tojen provided"));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    return next(new Error("Authentication error: Invalid token"));
  }
});

io.on("connection", (socket) => {
  console.log(`A user connected: ${socket.id}`);

  // Create room
  socket.on(
    "room:create",
    async ({ userId, roomName, password, username }, callback) => {
      try {
        const roomId = await createRoom(userId, roomName, password, username);
        socket.join(roomId);
        callback({ success: true, roomId });
      } catch (err) {
        callback({ success: false, message: err.message });
      }
    },
  );

  // Listen for joining a room
  socket.on(
    "room:join",
    async ({ roomId, userId, username, password }, callback) => {
      try {
        const users = await joinRoom(roomId, userId, password, username);
        socket.join(roomId);
        socket.userId = userId;
        socket.roomId = roomId;

        // Fetch chat history and canvas state from database
        const history = await getRoomMessages(roomId);
        const canvasState = await getRoomCanvasState(roomId);
        const creatorUsername = await getRoomCreatorUsername(roomId);

        // Send updated user list to everyone in the room
        const members = users.map((u) => ({
          userId: u.userId,
          username: u.username,
        }));

        // Notify existing users about the new user
        socket.to(roomId).emit("user-joined", { userId, username });

        io.to(roomId).emit("room:members", {
          members,
          createdBy: creatorUsername,
        });

        callback({
          success: true,
          users: members,
          createdBy: creatorUsername,
          history,
          canvasState,
        });
      } catch (err) {
        callback({ success: false, message: err.message });
      }
    },
  );

  // Get room members
  socket.on("room:members", ({ roomId }, callback) => {
    try {
      const members = getRoomMembers(roomId);
      callback({ success: true, members });
    } catch (err) {
      callback({ success: false, message: err.message });
    }
  });

  socket.on("leave-room", ({ roomId, userId }) => {
    socket.leave(roomId);
    const updatedUsers = leaveRoom(roomId, userId);
    const creatorUsername = getRoomCreatorUsernameInMemory(roomId);

    io.to(roomId).emit("room:members", {
      members: updatedUsers,
      createdBy: creatorUsername,
    });
  });

  socket.on("room:message", async ({ roomId, message }) => {
    try {
      // Save to DB
      await saveMessage(
        roomId,
        message.username,
        message.text,
        message.timestamp,
      );
      // Broadcast to everyone, including sender
      io.to(roomId).emit("room:message", message);
    } catch (err) {
      console.error("Error saving room message:", err);
    }
  });

  socket.on("draw", (newLine) => {
    if (socket.roomId) socket.to(socket.roomId).emit("draw", newLine);
  });

  socket.on("drawShape", (shape) => {
    if (socket.roomId) socket.to(socket.roomId).emit("drawShape", shape);
  });

  socket.on("draw:live", (newLine) => {
    if (socket.roomId) socket.to(socket.roomId).emit("draw:live", newLine);
  });

  socket.on("shape:live", (newLine) => {
    if (socket.roomId) socket.to(socket.roomId).emit("shape:live", newLine);
  });

  socket.on("shape:update", ({ id, updatedShape }) => {
    if (socket.roomId)
      socket.to(socket.roomId).emit("shape:update", { id, updatedShape });
  });

  socket.on("text:start", (textObj) => {
    if (socket.roomId) socket.to(socket.roomId).emit("text:start", textObj);
  });

  socket.on("text:update", (textObj) => {
    if (socket.roomId) socket.to(socket.roomId).emit("text:update", textObj);
  });

  socket.on("text:commit", (textObj) => {
    if (socket.roomId) socket.to(socket.roomId).emit("text:commit", textObj);
  });

  socket.on("text:updateFontFamily", ({ id, fontFamily }) => {
    if (socket.roomId)
      socket
        .to(socket.roomId)
        .emit("text:updateFontFamily", { id, fontFamily });
  });

  socket.on("text:updateFontStyle", ({ id, fontStyle }) => {
    if (socket.roomId)
      socket.to(socket.roomId).emit("text:updateFontStyle", { id, fontStyle });
  });

  socket.on("text:updateFontSize", ({ id, fontSize }) => {
    if (socket.roomId)
      socket.to(socket.roomId).emit("text:updateFontSize", { id, fontSize });
  });

  socket.on("erase", (coords) => {
    if (socket.roomId) socket.to(socket.roomId).emit("erase", coords);
  });

  socket.on("undo", (data) => {
    if (socket.roomId) socket.to(socket.roomId).emit("undo", data);
  });

  socket.on("redo", (data) => {
    if (socket.roomId) socket.to(socket.roomId).emit("redo", data);
  });

  socket.on("clear", () => {
    if (socket.roomId) socket.to(socket.roomId).emit("clear");
  });

  socket.on("color:change", (newColor) => {
    if (socket.roomId) socket.to(socket.roomId).emit("color:change", newColor);
  });

  socket.on("shape:fill", ({ id, fill }) => {
    if (socket.roomId)
      socket.to(socket.roomId).emit("shape:fill", { id, fill });
  });

  socket.on("text:fill", ({ id, fill }) => {
    if (socket.roomId) socket.to(socket.roomId).emit("text:fill", { id, fill });
  });

  socket.on("sync:state", async (stateData) => {
    if (socket.roomId) {
      try {
        // Save the state in the database
        await saveCanvasState(socket.roomId, stateData);
        // Broadcast the new state to everyone else in the room
        socket.to(socket.roomId).emit("sync:state", stateData);
      } catch (err) {
        console.error("Error saving canvas state:", err);
      }
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    const { roomId, userId } = socket;
    if (!roomId || !userId) return;

    const updatedUsers = leaveRoom(roomId, userId);
    const creatorUsername = getRoomCreatorUsernameInMemory(roomId);

    io.to(roomId).emit("room:members", {
      members: updatedUsers,
      createdBy: creatorUsername,
    });
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
