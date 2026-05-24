import { io } from "socket.io-client";

export const socket = io("http://localhost:5001", {
    transports: ["websocket"],
    reconnection: true,
    withCredentials: true,
    autoConnect: false,

    auth: (cb) => {
        // Fetch the fresh token right before connecting
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        
        // Pass the token to the callback
        cb({ token });
    }
})