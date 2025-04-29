const RoomUsersList = ({ users }) => {
  console.log(users);
  return (
    <div className="sm:w-56 w-auto rounded-2xl bg-white dark:bg-gray-800 shadow-lg p-4 mt-2 flex flex-col gap-2 border border-gray-200 dark:border-gray-700 overflow-y-auto max-h-64">
      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
        Room Users
      </h2>
      {users.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No users joined yet.
        </p>
      ) : (
        users.map((user) => (
          <div
            key={user.userId}
            className="text-sm px-3 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
          >
            {user.username || "Unnamed user"}
          </div>
        ))
      )}
    </div>
  );
};

export default RoomUsersList;
