import { useState } from "react";
import SettingsPanel from "./SettingsPanel";
import RoomUsersList from "./RoomUsersList";
import ChatPanel from "./ChatPanel";
import { MessageCircle, Sliders, Users } from "lucide-react";

const RightPanelTabs = ({ selectedTool }) => {
  const [activeTab, setActiveTab] = useState("settings");

  const renderTabContent = () => {
    switch (activeTab) {
      case "settings":
        return <SettingsPanel selectedTool={selectedTool} />;
      case "users":
        return <RoomUsersList />;
      case "chat":
        return <ChatPanel />;
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
      id: "user",
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
