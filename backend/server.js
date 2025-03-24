const express = require("express")
const { createServer } = require("http")    //  Create an HTTP server
const { Server } = require("socket.io")     // Import Socket.IO for WebSocket communication
const cors = require("cors")
const pool = require("./db")

const app = express()   //  Initialize Express.js app
const server = createServer(app)    //  Create an HTTP server
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",    // Allow connections from the frontend
        methods: ["GET", "POST"]    // Allow GET and POST requests
    }
})

//  Middleware to enable CORS and JSON parsing
app.use(cors())
app.use(express.json())

//  WebSocket connection handling
io.on("connection", (socket) => {
    console.log(`A user connected: ${socket.id}`)

    /**
     * Event Listener: Listens for "draw" events from a connected client.
     * Broadcasts the drawing data to all other connected users.
     */
    socket.on("draw", async (drawingData) => {
        socket.broadcast.emit("draw", drawingData) //  Send the received drawing data to all other clients

        // Save drawing to the database
        try {
            await pool.query("INSERT INTO drawings (data) VALUES ($1)", [JSON.stringify(drawingData)])
        } catch (error) {
            console.error("Error saving drawing:", error);
        }
    })

    // Event Listener: Triggered when a user disconnects from the server
    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`)
    })
})
// }) Start the Express server on port 5000
server.listen(5000, () => {
    console.log("Backend server running on http://localhost:5000")
})