import { nanoid } from "nanoid"

const rooms = {}

function getRooms() {
    return rooms
}

function createRoom(creatorUserId, roomName, password, username) {
    const roomId = nanoid(8)
    rooms[roomId] = {
        roomName,
        password,
        creator: creatorUserId,
        createdBy: username,
        users: [{ userId: creatorUserId, username }],
    }
    return roomId
}

function joinRoom(roomId, userId, password, username) {
    const room = rooms[roomId];

    if (!room) throw new Error("Room not found")
    if (room.password !== password) throw new Error("Incorrect password")

    const alreadyInRoom = room.users.find((u) => u.userId === userId)
    if (!alreadyInRoom) {
        room.users.push({ userId, username })
    }

    console.log(roomId, userId, password, username);

    return room.users
}

function getRoomMembers(roomId) {
    const room = rooms[roomId]
    if (!room) throw new Error("Room not found")
    return room.users
}

export { createRoom, joinRoom, getRoomMembers, getRooms }