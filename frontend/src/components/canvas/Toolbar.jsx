import { useEffect, useState } from "react";
// Import icons for Undo, Redo, Clear
import { FaUndo, FaRedo, FaTrash } from "react-icons/fa";
// Import custom UI components
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import ZoomControls from "./ZoomControls";
import { useDispatch, useSelector } from "react-redux";
import {
  deselectText,
  toggleGrid,
  updateTextContent,
} from "@/store/drawingSlice";
import { useTextDeselect } from "@/hooks/useTextDeselect";

/**
 * Toolbar Component
 * Provides controls for undo, redo, clearing the canvas and toggling dark mode.
 *
 * Props:
 * - onUndo: function to handle undo operation
 * - onRedo: function to handle redo operation
 * - onClear: function to handle clearing the canvas
 */
const Toolbar = ({ onUndo, onRedo, onClear, stageRef }) => {
  //  Manage dark mode toggle using localStorage for persistence
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );
  const dispatch = useDispatch();

  const showGrid = useSelector((state) => state.drawing.showGrid);
  const selectedTextId = useSelector((state) => state.drawing.selectedTextId);
  const texts = useSelector((state) => state.drawing.texts);
  const selectedText = texts.find((t) => t.id === selectedTextId);

  const shouldShowFontSizeControl = selectedText && selectedTextId;

  // Custom hook to deselect text on canvas click or Escape
  useTextDeselect(stageRef);

  //  Whenever dark mode state changes, apply/remove the `dark` class to the root element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark"); //  Persist choice
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light"); //  Persist choice
    }
  }, [isDarkMode]);

  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === "Escape") {
        dispatch(deselectText());
      }
    };

    window.addEventListener("keydown", handleEscKey);
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [dispatch]);

  return (
    <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-4 bg-white dark:bg-gray-700 p-4 rounded-lg shadow-lg border border-gray-300 dark:border-gray-700 mb-4">
      {/* Undo Button */}
      <Button
        variant="outline"
        onClick={onUndo}
        className="flex items-center gap-2 text-blue-600 bg-blue-100 hover:bg-blue-200 dark:text-blue-300 dark:bg-blue-700 dark:hover:bg-blue-800 w-full sm:w-auto hover:scale-105 transition-all"
      >
        <FaUndo className="text-lg" />
        Undo
      </Button>

      {/* Redo Button */}
      <Button
        variant="outline"
        onClick={onRedo}
        className="flex items-center gap-2 text-green-600 bg-green-100 hover:bg-green-200 dark:text-green-300 dark:bg-green-700 dark:hover:bg-green-800 w-full sm:w-auto hover:scale-105 transition-all"
      >
        <FaRedo className="text-lg" />
        Redo
      </Button>

      {/* Clear Button */}
      <Button
        variant="destructive"
        onClick={onClear}
        className="flex items-center gap-2 text-white hover:bg-red-400 dark:hover:bg-red-600 w-full sm:w-auto hover:scale-105 transition-all"
        mb-2
        md:mb-0
      >
        <FaTrash className="text-lg" />
        Clear
      </Button>

      {/* Dark Mode Toggle */}
      <div className="flex items-center space-x-2 mt-2 sm:mt-0">
        <Label
          htmlFor="dark-mode-toggle"
          className="text-gray-700 dark:text-gray-300"
        >
          Dark Mode
        </Label>
        <Switch
          id="dark-mode-toggle"
          checked={isDarkMode}
          onCheckedChange={(checked) => setIsDarkMode(checked)}
        />
      </div>

      <div className="absolute top-4 right-4">
        <ZoomControls />
      </div>

      <div className="flex items-center space-x-2 mt-2 sm:mt-0">
        <Label
          htmlFor="show-grid-toggle"
          className="text-gray-700 dark:text-gray-300"
        >
          Show Grid
        </Label>
        <Switch
          id="show-grid-toggle"
          checked={showGrid}
          onCheckedChange={() => dispatch(toggleGrid())}
        />
      </div>

      {shouldShowFontSizeControl && (
        <div className="flex items-center space-x-2 mt-2 sm:mt-0">
          <Label
            htmlFor="font-size-input"
            className="text-gray-700 dark:text-gray-300"
          >
            Font Size
          </Label>
          <input
            id="font-size-input"
            type="number"
            min={6}
            max={200}
            value={selectedText.fontSize}
            onChange={(e) =>
              dispatch(
                updateTextContent({
                  id: selectedTextId,
                  fontSize: parseInt(e.target.value, 10),
                })
              )
            }
            className="border px-2 py-1 rounded w-20 bg-white dark:bg-gray-600 text-black dark:text-white"
          />
        </div>
      )}
    </div>
  );
};

export default Toolbar;
