import { nanoid } from "nanoid";
import pool from "../db.js";

const activeRooms = {};

function getRooms() {
  return activeRooms;
}

async function createRoom(creatorUserId, roomName, password, username) {
  const roomId = nanoid(8);

  await pool.query(
    "INSERT INTO rooms (id, name, password, creator_id) VALUES ($1, $2, $3, $4)",
    [roomId, roomName, password, creatorUserId],
  );

  activeRooms[roomId] = {
    createdBy: username,
    users: [{ userId: creatorUserId, username }],
  };

  return roomId;
}

async function joinRoom(roomId, userId, password, username) {
  // Query database to authenticate room access
  const res = await pool.query("SELECT * FROM rooms WHERE id = $1", [roomId]);

  if (res.rows.length === 0) {
    throw new Error("Room not found");
  }

  const room = res.rows[0];
  if (room.password !== password) throw new Error("Incorrect password");

  // Initialize in-memory active users for this room if not already active
  if (!activeRooms[roomId]) {
    // Query the creator's username from database
    const creatorRes = await pool.query(
      "SELECT username FROM users WHERE id = $1",
      [room.creator_id],
    );

    const creatorUsername = creatorRes.rows[0]?.username || "System";
    activeRooms[roomId] = {
      createdBy: creatorUsername,
      users: [],
    };
  }

  const alreadyInRoom = activeRooms[roomId].users.find(
    (u) => u.userId === userId,
  );
  if (!alreadyInRoom) {
    activeRooms[roomId].users.push({ userId, username });
  }

  return activeRooms[roomId].users;
}

function getRoomMembers(roomId) {
  return activeRooms[roomId]?.users || [];
}

function leaveRoom(roomId, userId) {
  if (activeRooms[roomId]) {
    activeRooms[roomId].users = activeRooms[roomId].users.filter(
      (u) => u.userId !== userId,
    );
    const users = activeRooms[roomId].users;
    if (users.length === 0) {
      delete activeRooms[roomId];
    }

    return users;
  }

  return [];
}

function getRoomCreatorUsernameInMemory(roomId) {
  return activeRooms[roomId]?.createdBy || "";
}

async function getRoomCreatorUsername(roomId) {
  // Check in-memory active rooms first
  if (activeRooms[roomId]) {
    return activeRooms[roomId].createdBy;
  }

  // Otherwise query DB
  const res = await pool.query(
    "SELECT u.username FROM rooms r JOIN users u ON r.creator_id = u.id WHERE r.id = $1",
    [roomId],
  );
  return res.rows[0]?.username || "";
}

async function saveCanvasState(roomId, canvasState) {
  await pool.query("UPDATE rooms SET canvas_state = $1 WHERE id = $2", [
    JSON.stringify(canvasState),
    roomId,
  ]);
}

async function getRoomCanvasState(roomId) {
  const res = await pool.query("SELECT canvas_state FROM rooms WHERE id = $1", [
    roomId,
  ]);
  return res.rows[0]?.canvas_state || null;
}

async function saveMessage(roomId, username, text, timestamp) {
  await pool.query(
    "INSERT INTO messages (room_id, username, text, timestamp) VALUES ($1, $2, $3, $4)",
    [roomId, username, text, timestamp],
  );
}

async function getRoomMessages(roomId) {
  const res = await pool.query(
    "SELECT username, text, timestamp FROM messages WHERE room_id = $1 ORDER BY timestamp ASC",
    [roomId],
  );
  return res.rows.map((row) => ({
    username: row.username,
    text: row.text,
    timestamp: Number(row.timestamp),
  }));
}

export {
  createRoom,
  joinRoom,
  getRoomMembers,
  getRooms,
  leaveRoom,
  getRoomCreatorUsernameInMemory,
  getRoomCreatorUsername,
  saveCanvasState,
  getRoomCanvasState,
  saveMessage,
  getRoomMessages,
};
