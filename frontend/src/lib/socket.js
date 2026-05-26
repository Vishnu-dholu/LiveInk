import { io } from "socket.io-client";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

export const socket = io(BACKEND_URL, {
  transports: ["websocket"],
  reconnection: true,
  withCredentials: true,
  autoConnect: false,

  auth: (cb) => {
    // Fetch the fresh token right before connecting
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");

    // Pass the token to the callback
    cb({ token });
  },
});
