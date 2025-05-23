import express from "express"
import { createServer } from "http"    //  Create an HTTP server
import { Server } from "socket.io"     // Import Socket.IO for WebSocket communication
import cors from "cors"
import dotenv from "dotenv"
import authRoutes from "./routes/authRoutes.js"
import oauthRoutes from "./routes/oauthRoutes.js"
import roomRoutes from "./routes/roomRoutes.js"
import pool from "./db.js"
import initializePassport from "./config/passport.js"
import session from "express-session"
import passport from "passport"
import { createRoom, getRoomMembers, joinRoom, getRooms } from "./services/roomService.js"

dotenv.config()
initializePassport()

const app = express()   //  Initialize Express.js app
const rooms = getRooms()

Object.values(rooms).forEach(r => (r.messages = []))

app.use(session({
    secret: process.env.SESSION_SECRET || "some_secret",
    resave: false,
    saveUninitialized: false,
}))

const server = createServer(app)    //  Create an HTTP server
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",    // Allow connections from the frontend
        methods: ["GET", "POST"],    // Allow GET and POST requests
        credentials: true,
    }
})

//  Middleware to enable CORS and JSON parsing
app.use(cors({ origin: "http://localhost:5173", credentials: true }))
app.use(express.json())
app.use(passport.initialize())
app.use(passport.session())

app.use("/api/auth", authRoutes)
// app.use("/api/user", userRoutes)
app.use("/auth", oauthRoutes)
app.use("/api/rooms", roomRoutes)

io.on("connection", (socket) => {
    console.log(`A user connected: ${socket.id}`)

    // Create room
    socket.on("room:create", ({ userId, roomName, password, username }, callback) => {
        try {
            const roomId = createRoom(userId, roomName, password, username)
            socket.join(roomId)

            rooms[roomId] = rooms[roomId] || {}
            rooms[roomId].messages = []
            callback({ success: true, roomId })
        } catch (err) {
            callback({ success: false, message: err.message })
        }
    })

    // Listen for joining a room
    socket.on('room:join', ({ roomId, userId, username, password }, callback) => {
        try {
            const users = joinRoom(roomId, userId, password, username)
            socket.join(roomId)
            // socket.userId = userId
            socket.roomId = roomId

            rooms[roomId] = rooms[roomId] || {}
            rooms[roomId].messages = rooms[roomId].messages || []


            const room = rooms[roomId]
            // Send updated user list to everyone in the room
            const members = room.users.map(u => ({
                userId: u.userId,
                username: u.username,
            }))

            // Notify existing users about the new user
            socket.to(roomId).emit("user-joined", { userId, username })

            io.to(roomId).emit("room:members", { members, createdBy: room.createdBy })

            callback({ success: true, users: members, createdBy: room.createdBy, history: room.messages })
        } catch (err) {
            callback({ success: false, message: err.message })
        }
    })

    // Get room members
    socket.on("room:members", ({ roomId }, callback) => {
        try {
            const members = getRoomMembers(roomId)
            callback({ success: true, members })
        } catch (err) {
            callback({ success: false, message: err.message })
        }
    })

    socket.on("leave-room", ({ roomId, userId }) => {
        socket.leave(roomId)
        const room = rooms[roomId]

        if (room) {
            room.users = room.users.filter(u => u.userId !== userId)
            io.to(roomId).emit("room:member", { members: room.users, createdBy: room.createdBy });

            if (room.users.length === 0) {
                delete rooms[roomId]
            }
        }
    })

    socket.on("room:message", ({ roomId, message }) => {
        // make absolutely sure the room and its array exist
        if (!rooms[roomId]) {
            rooms[roomId] = { users: [], messages: [] }
        }
        rooms[roomId].messages = rooms[roomId].messages || []
        rooms[roomId].messages.push(message);
        // broadcast to everyone, including sender
        io.to(roomId).emit("room:message", message);
    });

    socket.on("draw", (newLine) => {
        socket.broadcast.emit("draw", newLine)
    });

    socket.on("drawShape", (shape) => {
        socket.broadcast.emit("drawShape", shape)
    });

    socket.on("draw:live", (newLine) => {
        socket.broadcast.emit("draw:live", newLine)
    });

    socket.on("shape:live", (newLine) => {
        socket.broadcast.emit("shape:live", newLine)
    });

    socket.on("shape:update", ({ id, updatedShape }) => {
        socket.broadcast.emit("shape:update", { id, updatedShape })
    })

    socket.on("text:start", (textObj) => {
        socket.broadcast.emit("text:start", textObj);
    });

    socket.on("text:update", (textObj) => {
        socket.broadcast.emit("text:update", textObj);
    });

    socket.on("text:commit", (textObj) => {
        socket.broadcast.emit("text:commit", textObj);
    });

    socket.on("text:updateFontFamily", ({ id, fontFamily }) => {
        socket.broadcast.emit("text:updateFontFamily", { id, fontFamily })
    })

    socket.on("text:updateFontStyle", ({ id, fontStyle }) => {
        socket.broadcast.emit("text:updateFontStyle", { id, fontStyle })
    })

    socket.on("text:updateFontSize", ({ id, fontSize }) => {
        socket.broadcast.emit("text:updateFontSize", { id, fontSize });
    });

    socket.on("erase", (coords) => {
        socket.broadcast.emit("erase", coords);
    });

    socket.on("undo", (data) => {
        socket.broadcast.emit("undo", data);
    });

    socket.on("redo", (data) => {
        socket.broadcast.emit("redo", data);
    });

    socket.on("clear", () => {
        socket.broadcast.emit("clear");
    });

    socket.on("color:change", (newColor) => {
        socket.broadcast.emit("color:change", newColor)
    })

    socket.on("shape:fill", ({ id, fill }) => {
        socket.broadcast.emit("shape:fill", { id, fill });
    });

    socket.on("text:fill", ({ id, fill }) => {
        socket.broadcast.emit("text:fill", { id, fill });
    });

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
        const { roomId, userId } = socket
        if (!roomId || !userId) return

        const room = rooms[roomId]
        if (room) {
            room.users = room.users.filter(u => u.userId !== userId)

            io.to(roomId).emit("room:member", { members: room.users })

            if (room.users.length === 0) {
                delete rooms[roomId]
            }
        }
    });
});


// }) Start the Express server on port 5000
server.listen(5001, () => {
    console.log("Backend server running on http://localhost:5001")
})