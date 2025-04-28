import { joinRoom } from "@/api/room";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { FiEye, FiEyeOff, FiHash, FiLock } from "react-icons/fi";
import { HomeIcon, LogOutIcon, MoonIcon, SunIcon } from "lucide-react";

const JoinRoomForm = () => {
  const [roomId, setRoomId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );
  const navigate = useNavigate();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

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

  const handleSignOut = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <>
      <div className="absolute flex justify-between items-center top-4 left-4 right-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="hover:text-yellow-400 dark:hover:text-yellow-300"
          >
            {isDarkMode ? <SunIcon size={20} /> : <MoonIcon size={20} />}
          </Button>

          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-gray-700 dark:text-gray-200 hover:text-blue-500 transition-all"
          >
            <HomeIcon className="w-5 h-5" />
          </Button>
        </div>

        <Button
          variant="outline"
          onClick={handleSignOut}
          className="text-gray-700 dark:text-gray-200 border-gray-400 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center gap-2"
        >
          <LogOutIcon size={18} />
          Sign Out
        </Button>
      </div>

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
    </>
  );
};

export default JoinRoomForm;
