import JoinRoomForm from "@/components/room/JoinRoomForm";
import { Link } from "react-router-dom";

const JoinRoomPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-100 via-slate-200 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 transition-colors duration-500">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-6">
            Join a Room
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
            Enter the Room ID and password (if needed).
          </p>
        </div>
        <JoinRoomForm />
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          Want to create your own room?{" "}
          <Link
            to="/create-room"
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            Create here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default JoinRoomPage;
