import React from "react";
import StrokeWidthPicker from "./StrokeWidthPicker";
import FontSizeControl from "./FontSizeControl";

const SettingsPanel = ({ selectedTool }) => {
  return (
    <div className="sm:w-56 w-auto h-full rounded-2xl bg-white dark:bg-gray-800 shadow-lg p-4 flex flex-col gap-4 border border-gray-200 dark:border-gray-700 overflow-y-auto">
      {["pen", "pencil"].includes(selectedTool) && <StrokeWidthPicker />}
      <FontSizeControl />
    </div>
  );
};

export default SettingsPanel;
