import { nanoid } from "nanoid"

const rooms = {}

function createRoom(creatorUserId, roomName, password) {
    const roomId = nanoid(8)
    rooms[roomId] = {
        roomName,
        password,
        creator: creatorUserId,
        users: [{ userId: creatorUserId }],
    }
    return roomId
}

function joinRoom(roomId, userId, password) {
    const room = rooms[roomId];
    if (!room) throw new Error("Room not found")
    if (room.password !== password) throw new Error("Incorrect password")

    const alreadyInRoom = room.users.find((u) => u.userId === userId)
    if (!alreadyInRoom) {
        room.users.push({ userId })
    }

    console.log(roomId, userId, password);

    return room.users
}

function getRoomMembers(roomId) {
    const room = rooms[roomId]
    if (!room) throw new Error("Room not found")
    return room.users
}

export { createRoom, joinRoom, getRoomMembers }