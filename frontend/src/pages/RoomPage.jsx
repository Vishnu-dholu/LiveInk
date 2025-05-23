import InviteLink from "@/components/room/InviteLink";
import { socket } from "@/lib/socket";
import {
  setRoomInfo,
  updateUsers,
  updateCreatedBy,
} from "@/store/drawingSlice";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

const RoomPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const users = useSelector((state) => state.drawing.users);

  const [joined, setJoined] = useState(false);
  const [username, setUsername] = useState("");
  const [createdBy, setCreatedBy] = useState("");
  const [chatHistory, setChatHistory] = useState([]);

  const password =
    new URLSearchParams(window.location.search).get("password") || "";

  useEffect(() => {
    const theme = localStorage.getItem("theme");
    document.documentElement.classList.toggle("dark", theme === "dark");

    const storedUser =
      localStorage.getItem("user") || sessionStorage.getItem("user");

    if (!storedUser) return navigate("/login");

    let user;
    try {
      user = JSON.parse(storedUser);
    } catch (e) {
      return navigate("/login");
    }

    const { username, userId } = user;
    if (!username || !userId) return navigate("/login");

    setUsername(username);

    // Emit join-room event
    socket.emit(
      "room:join",
      { roomId, userId, username, password },
      (response) => {
        if (response.success) {
          setJoined(true);
          setCreatedBy(response.createdBy || "");

          const validUser = (response.users || []).filter(
            (u) => u?.userId && u?.username
          );
          dispatch(
            setRoomInfo({
              roomId,
              createdBy: response.createdBy,
              users: validUser,
            })
          );

          setChatHistory(response.history || []);
        } else {
          alert(response.message);
          navigate("/join-room");
        }
      }
    );

    // Listen for member updates
    const onRoomMembers = ({ members, createdBy }) => {
      const validUsers = (members || []).filter(
        (u) => u?.userId && u?.username
      );
      dispatch(updateUsers(validUsers));
      dispatch(updateCreatedBy(createdBy));
    };

    socket.on("room:members", onRoomMembers);

    // Cleanup when unmount
    return () => {
      socket.emit("leave-room", { roomId, userId });
      socket.off("room:members", onRoomMembers);
    };
  }, []);

  const handleStartDrawing = () => navigate(`/room/${roomId}/draw`);

  if (!joined) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900">
        <h1 className="text-2xl text-gray-700 dark:text-gray-200 font-semibold mb-4">
          Joining Room...
        </h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 flex flex-col items-center justify-center p-6">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-8 w-full max-w-3xl">
        <h1 className="text-3xl font-bold text-center mb-4">
          Room Joined Successfully!
        </h1>
        <p className="text-center text-gray-600 italic dark:text-gray-300 mb-6">
          "Creativity is intelligence having fun." - Albert Einstein
        </p>
      </div>

      <InviteLink roomId={roomId} password={password} />

      {createdBy && (
        <div className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          {username === createdBy ? (
            <p>You are the creator of this room.</p>
          ) : (
            <p>
              Room created by: <strong>{createdBy}</strong>
            </p>
          )}
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Participants:</h2>
        {users.length > 0 ? (
          <ul className="grid grid-cols-2 gap-2">
            {users.map((user, i) => (
              <li
                key={user.userId || i}
                className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded text-sm flex items-center gap-2"
              >
                <div className="w-6 h-6 rounded-full bg-blue-400 text-white flex items-center justify-center text-xs font-bold">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span>
                  {user.username}
                  {user.username === createdBy && (
                    <span className="text-xs text-green-500 ml-1">
                      (Creator)
                    </span>
                  )}
                  {user.username === username && (
                    <span className="text-xs text-blue-500 ml-1">(You)</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">
            No other users yet.
          </p>
        )}
      </div>

      <div className="mt-8 flex justify-center gap-4">
        <button
          onClick={handleStartDrawing}
          className="bg-gray-600 hover:bg-green-700 text-white px-5 py-2 rounded text-lg transition"
        >
          Start Drawing
        </button>
        <button
          onClick={() => navigate("/")}
          className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded text-lg transition"
        >
          Leave Room
        </button>
      </div>
    </div>
  );
};

export default RoomPage;
