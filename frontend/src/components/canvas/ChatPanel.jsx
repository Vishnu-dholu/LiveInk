import { SendHorizonal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const ChatPanel = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;
    setMessages((prev) => [...prev, trimmed]);
    setMessage("");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-700 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800">
        <h2 className="text-base font-semibold text-gray-800 dark:text-white">
          Room Chat
        </h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm scroll-smooth">
        {messages.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center italic">
            No messages yet
          </p>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className="bg-gray-100 dark:bg-zinc-800 rounded-lg px-4 py-2 w-fit max-w-xs shadow-sm"
            >
              <span className="text-gray-900 dark:text-white">{msg}</span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        className="px-4 py-3 border-t border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800"
        onSubmit={handleSubmit}
      >
        <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none"
            placeholder="Type a message..."
          />
          <button
            type="submit"
            className="p-1.5 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
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
