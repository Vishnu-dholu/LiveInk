import { SendHorizonal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { socket } from "@/lib/socket";

const ChatPanel = ({ messages, onSendMessage }) => {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = message.trim();
    if (!text) return;

    onSendMessage(text);
    setMessage("");
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
          Room Chat
        </h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center italic">
            No messages yet
          </p>
        ) : (
          messages.map((msg, index) => {
            const me = JSON.parse(localStorage.getItem("user") || "{}");
            const isOwnMessage = msg.username === me.username;

            const formattedTime = new Date(msg.timestamp).toLocaleTimeString(
              [],
              {
                hour: "2-digit",
                minute: "2-digit",
              }
            );

            return (
              <div
                key={index}
                className={`flex w-full ${
                  isOwnMessage ? "justify-end" : "justify-start"
                }`}
              >
                {/* Avatar on left for others */}
                {!isOwnMessage && (
                  <div className="w-8 h-8 rounded-full bg-blue-400 text-white flex items-center justify-center mr-2 shrink-0">
                    {msg.username.charAt(0).toUpperCase()}
                  </div>
                )}

                <div
                  className={`max-w-[70%] px-4 py-2 rounded-2xl shadow ${
                    isOwnMessage
                      ? "bg-blue-400 dark:bg-blue-500 text-white rounded-br-sm rounded-tr-2xl"
                      : "bg-gray-200 text-gray-900 dark:bg-zinc-700 dark:text-white rounded-bl-sm rounded-tl-2xl"
                  }`}
                >
                  {!isOwnMessage && (
                    <p className="text-xs font-semibold text-orange-500">
                      {msg.username}
                    </p>
                  )}
                  <p className="text-sm">{msg.text}</p>
                  <p className="text-[10px] text-gray-700 dark:text-gray-300 mt-1 text-right">
                    {formattedTime}
                  </p>
                </div>

                {/* Space for my avatar */}
                {isOwnMessage && <div className="w-8 h-8" />}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        className="px-4 py-3 border-t border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800"
        onSubmit={handleSubmit}
      >
        <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-full px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-400">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500"
            placeholder="Type a message..."
          />
          <button
            type="submit"
            className="p-1.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900 transition"
            aria-label="Send Message"
          >
            <SendHorizonal className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatPanel;
