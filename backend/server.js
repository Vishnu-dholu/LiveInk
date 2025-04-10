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

// Store redo history
const userRedoStacks = new Map();

//  WebSocket connection handling
// io.on("connection", (socket) => {
//     console.log(`A user connected: ${socket.id}`)

//     userRedoStacks.set(socket.id, []);

//     /**
//      * Event Listener: Listens for "draw" events from a connected client.
//      * Broadcasts the drawing data to all other connected users.
//      */
//     socket.on("draw", async (newLine) => {
//         socket.broadcast.emit("draw", newLine) //  Send the received drawing data to all other clients

//         // Save drawing to the database
//         // try {
//         //     await pool.query("INSERT INTO drawings (drawing_data) VALUES ($1)", [JSON.stringify(newLine)])
//         // } catch (error) {
//         //     console.error("Error saving drawing:", error);
//         // }
//     })

//     socket.on("undo", (previousState, data) => {
//         const redoStack = userRedoStacks.get(socket.id)
//         if (!redoStack) {
//             console.log(`Redo stack not found for user: ${socket.id}`)
//             return
//         }
//         redoStack.push(previousState)
//         socket.broadcast.emit("undo", data);
//         io.emit("undo", previousState)
//     });

//     socket.on("redo", (data) => {
//         const redoStack = userRedoStacks.get(socket.id)
//         if (!redoStack || redoStack.length === 0) {
//             console.log("Redo stack is empty.")
//             return
//         }

//         const nextState = redoStack.pop()
//         socket.broadcast.emit("redo", data);
//         io.emit("redo", nextState)
//     })

//     socket.on("clear", async () => {
//         redoStack = []
//         io.emit("clear")

//         try {
//             await pool.query("DELETE FROM drawings")
//         } catch (error) {
//             console.error("Error clearing drawings:", error);
//         }
//     })

//     // Event Listener: Triggered when a user disconnects from the server
//     socket.on("disconnect", () => {
//         console.log(`User disconnected: ${socket.id}`)
//         userRedoStacks.delete(socket.id)
//     })
// })

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

    socket.on("text:start", (textObj) => {
        socket.broadcast.emit("text:start", textObj);
    });

    socket.on("text:update", (textObj) => {
        socket.broadcast.emit("text:update", textObj);
    });

    socket.on("text:commit", (textObj) => {
        socket.broadcast.emit("text:commit", textObj);
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

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});


// }) Start the Express server on port 5000
server.listen(5000, () => {
    console.log("Backend server running on http://localhost:5000")
})