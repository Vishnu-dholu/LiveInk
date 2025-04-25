import express, { json } from "express"
import { createServer } from "http"    //  Create an HTTP server
import { Server } from "socket.io"     // Import Socket.IO for WebSocket communication
import cors from "cors"
import dotenv from "dotenv"
import authRoutes from "./routes/authRoutes.js"
import pool from "./db.js"

dotenv.config()

const app = express()   //  Initialize Express.js app
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
app.use(json())

app.use("/api/auth", authRoutes)
// app.use("/api/user", userRoutes)

io.on("connection", (socket) => {
    console.log(`A user connected: ${socket.id}`)

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
    });
});


// }) Start the Express server on port 5000
server.listen(5000, () => {
    console.log("Backend server running on http://localhost:5000")
})