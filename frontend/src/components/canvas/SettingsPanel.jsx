import React from "react";
import StrokeWidthPicker from "./StrokeWidthPicker";
import FontSizeControl from "./Text/FontSizeControl";
import FontStyleSelector from "./Text/FontStyleSelector";
import { useSelector } from "react-redux";

const SettingsPanel = ({ selectedTool }) => {
  const selectedTextId = useSelector((state) => state.drawing.selectedTextId);

  const showStrokeControls = ["pen", "pencil"].includes(selectedTool);
  const showTextControls =
    selectedTool === "text" || (selectedTool === "select" && selectedTextId);
  const hasSettings = showTextControls || showStrokeControls;
  return (
    <div className="sm:w-64 w-auto h-full rounded-2xl bg-white dark:bg-gray-900 shadow-md p-5 flex flex-col gap-6 border border-gray-200 dark:border-gray-700 overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out">
      {hasSettings ? (
        <>
          {showTextControls && (
            <div children="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 border-b pb-1 border-gray-300 dark:border-gray-700">
                Text Settings
              </h3>
              <FontSizeControl />
              <FontStyleSelector />
            </div>
          )}
          {showStrokeControls && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 border-b pb-1 border-gray-300 dark:border-gray-700">
                Stroke Settings
              </h3>
              <StrokeWidthPicker />
            </div>
          )}
        </>
      ) : (
        // Friendly placeholder when no settings are available for selected tool
        <div className="flex flex-col items-center justify-center mt-16 text-gray-500 dark:text-gray-400 text-center space-y-2">
          <span className="text-3xl">🛠️</span>
          <p className="text-sm font-medium">
            Select a tool to adjust its settings
          </p>
        </div>
      )}
    </div>
  );
};

export default SettingsPanel;
