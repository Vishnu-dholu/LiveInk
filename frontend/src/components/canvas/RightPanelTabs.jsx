import { useEffect, useState } from "react";
import SettingsPanel from "./SettingsPanel";
import RoomUsersList from "./RoomUsersList";
import ChatPanel from "./ChatPanel";
import { MessageCircle, Sliders, Users } from "lucide-react";
import { useParams } from "react-router-dom";
import { socket } from "@/lib/socket";

const RightPanelTabs = ({ selectedTool, initialHistory = [] }) => {
  const [activeTab, setActiveTab] = useState("chat");
  const [messages, setMessages] = useState(initialHistory);
  const { roomId } = useParams();

  useEffect(() => {
    setMessages(initialHistory);
  }, [initialHistory]);

  useEffect(() => {
    if (!roomId) return;

    const handleIncoming = (msg) => setMessages((prev) => [...prev, msg]);

    socket.on("room:message", handleIncoming);
    return () => void socket.off("room:message", handleIncoming);
  }, [roomId]);

  const handleSendMessage = (text) => {
    const me = JSON.parse(localStorage.getItem("user"));
    const newMessage = {
      username: me.username,
      text,
      timestamp: Date.now(),
    };

    socket.emit("room:message", { roomId, message: newMessage });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "property":
        return <SettingsPanel selectedTool={selectedTool} />;
      case "users":
        return <RoomUsersList />;
      case "chat":
        return (
          <ChatPanel messages={messages} onSendMessage={handleSendMessage} />
        );
      default:
        return null;
    }
  };

  const tabs = [
    {
      id: "property",
      icon: <Sliders size={18} />,
      label: "Property",
    },
    {
      id: "users",
      icon: <Users size={18} />,
      label: "User",
    },
    {
      id: "chat",
      icon: <MessageCircle size={18} />,
      label: "Chat",
    },
  ];

  return (
    <div className="w-[300px] h-full flex flex-col rounded-2xl bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700">
      <div className="flex border-b rounded-t-2xl border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-2 py-2">
        {tabs.map(({ id, icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            aria-label={label}
            className={`flex flex-col flex-1 items-center justify-center px-3 py-1.5 rounded-md transition-all duration-200 ${
              activeTab === id
                ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-semibold"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-blue-500"
            }`}
          >
            {icon}
            <span className="text-xs mt-1">{label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">{renderTabContent()}</div>
    </div>
  );
};

export default RightPanelTabs;
