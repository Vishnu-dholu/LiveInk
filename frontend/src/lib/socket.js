import { io } from "socket.io-client";

export const socket = io("http://localhost:5001", {
    transports: ["websocket"],
    reconnection: true,
    withCredentials: true,
})