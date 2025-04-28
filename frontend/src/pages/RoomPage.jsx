import { socket } from "@/lib/socket";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const RoomPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    // Emit join-room event
    socket.emit("join-room", { roomId });

    // Listen for success confirmation
    socket.on("room-joined", () => {
      setJoined(true);
    });

    // Listen for errors
    socket.on("room-error", (errorMessage) => {
      alert(errorMessage);
      navigate("/join-room");
    });

    // Cleanup when unmount
    return () => {
      socket.emit("leave-room", { roomId });
      socket.off("room-joined");
      socket.off("room-error");
    };
  }, [roomId, navigate]);

  if (!joined) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Joining Room...</h1>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">You are inside Room: {roomId}</h1>
    </div>
  );
};

export default RoomPage;
