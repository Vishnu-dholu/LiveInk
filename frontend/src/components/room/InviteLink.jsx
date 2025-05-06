import { useState } from "react";

const InviteLink = ({ roomId, password }) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const inviteLink = `${window.location.origin}/room/${roomId}?password=${password}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopySuccess(true);
      setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
    } catch (err) {
      alert("Failed to copy the invite link.");
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
        Room ID:
      </label>
      <div className="flex items-center gap-2">
        <span className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded text-sm font-mono">
          {roomId}
        </span>
        <button
          onClick={handleCopyLink}
          className={`${
            copySuccess ? "bg-green-500" : "bg-blue-500 hover:bg-blue-600"
          } text-white text-sm px-3 py-1 rounded transition`}
        >
          {copySuccess ? "Link Copied!" : "Copy Invite Link"}
        </button>
      </div>
    </div>
  );
};

export default InviteLink;
