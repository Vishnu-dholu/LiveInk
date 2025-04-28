import { joinRoom } from "@/api/room";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { FiEye, FiEyeOff, FiHash, FiLock } from "react-icons/fi";

const JoinRoomForm = () => {
  const [roomId, setRoomId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await joinRoom({ roomId, password });
      console.log(`${res.data.roomId}`);
      navigate(`/room/${res.data.roomId}`);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to join room");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Room ID Input */}
      <div className="relative">
        <FiHash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          required
        />
      </div>

      {/* Password Input with Toggle */}
      <div className="relative">
        <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Room Password (if any)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full pl-10 pr-12 py-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-300"
        >
          {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
        </button>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-transform duration-200 hover:scale-105"
      >
        {isLoading ? "Joining Room..." : "Join Room"}
      </Button>
    </form>
  );
};

export default JoinRoomForm;
