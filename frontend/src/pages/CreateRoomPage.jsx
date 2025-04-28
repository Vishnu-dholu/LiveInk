import CreateRoomForm from "@/components/room/CreateRoomForm";
import { Link } from "react-router-dom";

const CreateRoomPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-100 via-slate-200 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 transition-colors duration-500">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-6">
            Create a Room
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
            Set up your room and share the ID with friends!
          </p>
        </div>
        <CreateRoomForm />
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          Already have a room?{" "}
          <Link
            to="/join-room"
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            Join here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CreateRoomPage;
