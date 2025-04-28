import express from "express"
import { createRoom, joinRoom } from "../services/roomService.js"
import { verifyToken } from "../middleware/authMiddleware.js"

const router = express.Router()

// Create Room
router.post("/create", verifyToken, (req, res) => {
    const { roomName, password } = req.body
    const userId = req.user.id

    try {
        const roomId = createRoom(userId, roomName, password)
        res.status(201).json({ roomId })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Join Room
router.post("/join", verifyToken, (req, res) => {
    const { roomId, password } = req.body
    const userId = req.user.id

    try {
        const members = joinRoom(roomId, userId, password)
        res.status(200).json({ message: 'Joined room successfully', members, roomId })
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

export default router