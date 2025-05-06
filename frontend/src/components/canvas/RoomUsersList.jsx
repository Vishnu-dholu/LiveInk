import { useSelector } from "react-redux";

const RoomUsersList = () => {
  const users = useSelector((state) => state.drawing.users);
  const createdBy = useSelector((state) => state.drawing.createdBy);

  return (
    <div className="sm:w-56 w-auto rounded-2xl bg-white dark:bg-gray-800 shadow-lg p-4 mt-2 flex flex-col gap-2 border border-gray-200 dark:border-gray-700 overflow-y-auto max-h-64 overflow-hidden">
      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
        Room Users
      </h2>
      {!users || users.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No users joined yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {users.map((user) => (
            <li
              key={user.userId || user.username}
              className="flex items-center gap-2 px-3 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                {user.username?.charAt(0).toUpperCase() || "?"}
              </div>
              <span>
                {user.username || "Unnamed user"}
                {user.username === createdBy && (
                  <span className="text-xs text-green-400 ml-1">(Creator)</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RoomUsersList;
