import { nanoid } from "nanoid";
import pool from "../db.js";
import bcrypt from "bcryptjs";
import { createCanvas, serializeCanvas, applyOps } from "./canvasService.js";

const SAVE_DEBOUNCE_MS = 2000;
const MAX_ROOM_NAME_LENGTH = 100;
const MAX_ROOM_PASSWORD_LENGTH = 72;

/**
 * In-memory state for rooms that currently have users:
 * { createdBy, users: [{userId, username}], canvas, dirty, saveTimer }
 */
const activeRooms = {};

function getRooms() {
  return activeRooms;
}

async function getUsernameById(userId) {
  const res = await pool.query("SELECT username FROM users WHERE id = $1", [userId]);
  return res.rows[0]?.username || null;
}

async function createRoom(creatorUserId, roomName, password) {
  const name = typeof roomName === "string" ? roomName.trim() : "";
  if (!name || name.length > MAX_ROOM_NAME_LENGTH) {
    throw new Error(`Room name must be 1-${MAX_ROOM_NAME_LENGTH} characters`);
  }
  if (password && (typeof password !== "string" || password.length > MAX_ROOM_PASSWORD_LENGTH)) {
    throw new Error(`Password must be at most ${MAX_ROOM_PASSWORD_LENGTH} characters`);
  }

  const roomId = nanoid(8);
  const hashedPassword = password ? await bcrypt.hash(password, 10) : "";

  await pool.query(
    "INSERT INTO rooms (id, name, password, creator_id) VALUES ($1, $2, $3, $4)",
    [roomId, name, hashedPassword, creatorUserId],
  );

  return roomId;
}

// Verifies the room exists and the password matches; returns the room row
async function authorizeRoomAccess(roomId, password) {
  if (typeof roomId !== "string" || !roomId) throw new Error("Room not found");

  const res = await pool.query("SELECT * FROM rooms WHERE id = $1", [roomId]);
  if (res.rows.length === 0) throw new Error("Room not found");

  const room = res.rows[0];
  if (room.password) {
    const supplied = typeof password === "string" ? password : "";
    // Legacy rows may still hold a plaintext password; hashed rows only ever go through bcrypt
    const isMatch = room.password.startsWith("$2")
      ? await bcrypt.compare(supplied, room.password)
      : supplied === room.password;
    if (!isMatch) throw new Error("Incorrect password");
  }

  return room;
}

async function joinRoom(roomId, userId, password, username) {
  const room = await authorizeRoomAccess(roomId, password);

  if (!activeRooms[roomId]) {
    const creatorUsername = (await getUsernameById(room.creator_id)) || "System";

    // Another join may have created the entry while we awaited
    if (!activeRooms[roomId]) {
      activeRooms[roomId] = {
        createdBy: creatorUsername,
        users: [],
        canvas: createCanvas(room.canvas_state),
        dirty: false,
        saveTimer: null,
      };
    }
  }

  const alreadyInRoom = activeRooms[roomId].users.find((u) => u.userId === userId);
  if (!alreadyInRoom) {
    activeRooms[roomId].users.push({ userId, username });
  }

  return activeRooms[roomId].users;
}

function getRoomMembers(roomId) {
  return activeRooms[roomId]?.users || [];
}

function leaveRoom(roomId, userId) {
  const room = activeRooms[roomId];
  if (!room) return [];

  room.users = room.users.filter((u) => u.userId !== userId);
  if (room.users.length === 0) {
    // Persist any pending canvas changes before dropping the room from memory
    flushCanvas(roomId).finally(() => {
      if (activeRooms[roomId]?.users.length === 0) delete activeRooms[roomId];
    });
  }

  return room.users;
}

function getRoomCreatorUsernameInMemory(roomId) {
  return activeRooms[roomId]?.createdBy || "";
}

async function getRoomCreatorUsername(roomId) {
  if (activeRooms[roomId]) {
    return activeRooms[roomId].createdBy;
  }

  const res = await pool.query(
    "SELECT u.username FROM rooms r JOIN users u ON r.creator_id = u.id WHERE r.id = $1",
    [roomId],
  );
  return res.rows[0]?.username || "";
}

// ----- Canvas (delta based) -----

function getCanvasSnapshot(roomId) {
  const room = activeRooms[roomId];
  return room ? serializeCanvas(room.canvas) : { lines: [], shapes: [], texts: [] };
}

// Applies client ops to the room's canvas and schedules a debounced save.
// Returns the ops that were accepted (to be relayed to the other clients).
function applyCanvasOps(roomId, ops) {
  const room = activeRooms[roomId];
  if (!room) return [];

  const applied = applyOps(room.canvas, ops);
  if (applied.length > 0) {
    room.dirty = true;
    if (!room.saveTimer) {
      room.saveTimer = setTimeout(() => {
        flushCanvas(roomId).catch((err) => console.error("Error saving canvas state:", err));
      }, SAVE_DEBOUNCE_MS);
    }
  }
  return applied;
}

async function flushCanvas(roomId) {
  const room = activeRooms[roomId];
  if (!room) return;

  clearTimeout(room.saveTimer);
  room.saveTimer = null;
  if (!room.dirty) return;

  room.dirty = false;
  try {
    await pool.query("UPDATE rooms SET canvas_state = $1 WHERE id = $2", [
      JSON.stringify(serializeCanvas(room.canvas)),
      roomId,
    ]);
  } catch (err) {
    room.dirty = true; // retry on the next change / flush
    throw err;
  }
}

async function flushAllCanvases() {
  await Promise.allSettled(Object.keys(activeRooms).map(flushCanvas));
}

// ----- Chat -----

async function saveMessage(roomId, username, text, timestamp) {
  await pool.query(
    "INSERT INTO messages (room_id, username, text, timestamp) VALUES ($1, $2, $3, $4)",
    [roomId, username, text, timestamp],
  );
}

async function getRoomMessages(roomId, limit = 200) {
  // Latest `limit` messages, returned oldest first
  const res = await pool.query(
    `SELECT username, text, timestamp FROM (
       SELECT username, text, timestamp FROM messages
       WHERE room_id = $1 ORDER BY timestamp DESC LIMIT $2
     ) recent ORDER BY timestamp ASC`,
    [roomId, limit],
  );
  return res.rows.map((row) => ({
    username: row.username,
    text: row.text,
    timestamp: Number(row.timestamp),
  }));
}

export {
  createRoom,
  authorizeRoomAccess,
  joinRoom,
  getUsernameById,
  getRoomMembers,
  getRooms,
  leaveRoom,
  getRoomCreatorUsernameInMemory,
  getRoomCreatorUsername,
  getCanvasSnapshot,
  applyCanvasOps,
  flushAllCanvases,
  saveMessage,
  getRoomMessages,
};
