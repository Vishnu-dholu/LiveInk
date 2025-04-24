import React from "react";
import StrokeWidthPicker from "./StrokeWidthPicker";
import FontSizeControl from "./Text/FontSizeControl";
import FontStyleSelector from "./Text/FontStyleSelector";
import { useSelector } from "react-redux";

const SettingsPanel = ({ selectedTool }) => {
  const selectedTextId = useSelector((state) => state.drawing.selectedTextId);

  const showStrokeControls = ["pen", "pencil"].includes(selectedTool);
  const showTextControls = selectedTool === "text" || !!selectedTextId;

  const hasSettings = showStrokeControls || showTextControls;
  return (
    <div className="sm:w-56 w-auto h-full rounded-2xl bg-white dark:bg-gray-800 shadow-lg p-4 flex flex-col gap-4 border border-gray-200 dark:border-gray-700 overflow-y-auto">
      {hasSettings ? (
        <>
          {showStrokeControls && <StrokeWidthPicker />}
          {showTextControls && (
            <>
              <FontSizeControl />
              <FontStyleSelector />
            </>
          )}
        </>
      ) : (
        // Friendly placeholder when no settings are available for selected tool
        <div className="flex flex-col items-center justify-center mt-8 text-gray-500 dark:text-gray-400">
          <span className="text-2xl">🛠️</span>
          <p className="text-sm mt-2 text-center">
            Select a tool to adjust its settings
          </p>
        </div>
      )}
    </div>
  );
};

export default SettingsPanel;
