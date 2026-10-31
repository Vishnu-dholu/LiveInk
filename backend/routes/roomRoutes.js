import express from "express";
import {
  createRoom,
  authorizeRoomAccess,
  getRoomMembers,
  getUsernameById,
} from "../services/roomService.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create Room
router.post("/create", verifyToken, async (req, res) => {
  const { roomName, password } = req.body || {};

  try {
    const username = await getUsernameById(req.user.id);
    if (!username) return res.status(401).json({ error: "User not found" });

    const roomId = await createRoom(req.user.id, roomName, password);
    res.status(201).json({ roomId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Check room access (membership itself is established over the socket)
router.post("/join", verifyToken, async (req, res) => {
  const { roomId, password } = req.body || {};

  try {
    await authorizeRoomAccess(roomId, password);
    res.status(200).json({ message: "Access granted", members: getRoomMembers(roomId), roomId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
