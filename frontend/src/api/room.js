import { authFetch } from "@/lib/authFetch";

// Create Room
export async function createRoom({ roomName, password }) {
    return authFetch("/api/rooms/create", {
        method: "POST",
        body: JSON.stringify({ roomName, password })
    })
}

// Join Room
export async function joinRoom({ roomId, password }) {
    return authFetch("/api/rooms/join", {
        method: "POST",
        body: JSON.stringify({ roomId, password })
    })
}

// Fetch Room
export async function fetchRoom(roomId) {
    return authFetch(`/api/rooms/${roomId}`)
}