// Importing React hooks and necessary functions
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { shallowEqual } from "react-redux";

// UI components
import Toolbar from "./Toolbar"; //  Top-bar with undo, redo, clear
import Toolbox from "./Toolbox"; //  Side toolbox with drawing tools
import DrawingStage from "./DrawingStage"; //  The Konva canvas rendering layer

// Redux actions for undo, redo and clearing canvas
import {
  undoAction,
  redoAction,
  clearCanvas,
  updateCurrentLine,
  updateCurrentShape,
  setStagePosition,
  setSelectedTool,
} from "@/store/drawingSlice";
// Socket instance for real-time collaboration
import { socket } from "@/lib/socket";
import { useSocketListeners } from "@/hooks/useSocketListeners";
import ColorPickerWrapper from "./ColorPickerWrapper";
import SettingsPanel from "./SettingsPanel";

// Constants for large virtual canvas
const virtualCanvasWidth = 10000;
const virtualCanvasHeight = 10000;

const Canvas = () => {
  const dispatch = useDispatch();
  // Ref to the Konva stage element
  const stageRef = useRef();
  // Tracks the currently selected drawing tool
  const selectedTool = useSelector(
    (state) => state.drawing.selectedTool,
    shallowEqual
  );

  // Redux state: all drawn lines
  const lines = useSelector((state) => state.drawing.lines, shallowEqual);
  // Redux state: all drawn shapes
  const shapes = useSelector((state) => state.drawing.shapes, shallowEqual);
  // Redux state: the current line being drawn (live)
  const currentLine = useSelector(
    (state) => state.drawing.currentLine,
    shallowEqual
  );
  const zoom = useSelector((state) => state.drawing.zoom, shallowEqual);

  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false); // Manage color picker visibility

  // Register socket listeners (text, drawing, undo, etc.)
  useSocketListeners(socket);

  const centerStage = useCallback(() => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    const offsetX = Math.max(
      0,
      screenWidth / 2 - (virtualCanvasWidth * zoom) / 2
    );
    const offsetY = Math.max(
      0,
      screenHeight / 2 - (virtualCanvasHeight * zoom) / 2
    );

    dispatch(setStagePosition({ x: offsetX, y: offsetY }));
  }, [zoom, dispatch]);

  useEffect(() => {
    centerStage();
    window.addEventListener("resize", centerStage);
    return () => window.removeEventListener("resize", centerStage);
  }, [centerStage]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === "z") {
        handleUndo();
      } else if (e.ctrlKey && e.shiftKey && e.key === "Z") {
        handleRedo();
      } else if (e.key === "Delete") {
        handleClear();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handler for tool selection from toolbox
  const handleSelectTool = useCallback(
    (tool) => {
      dispatch(setSelectedTool(tool));
      if (tool === "paint") {
        setIsColorPickerOpen(true); // Open color picker when paint tool is selected
      } else {
        setIsColorPickerOpen(false); // Close color picker when other tool is selected
      }
    },
    [dispatch]
  );

  // Undo action and emit to other users via socket
  const handleUndo = useCallback(() => {
    dispatch(undoAction());
    dispatch(updateCurrentLine([]));
    dispatch(updateCurrentShape([]));
    socket.emit("undo", { userId: socket.id });
  }, [dispatch]);

  // Redo action and emit to other users via socket
  const handleRedo = useCallback(() => {
    dispatch(redoAction());
    dispatch(updateCurrentLine([]));
    dispatch(updateCurrentShape([]));
    socket.emit("redo", { userId: socket.id });
  }, [dispatch]);

  // Clear canvas and emit to other users
  const handleClear = useCallback(() => {
    dispatch(clearCanvas());
    dispatch(updateCurrentLine([]));
    dispatch(updateCurrentShape([]));
    socket.emit("clear");
  }, [dispatch]);

  // Memoize DrawingStage props to prevent unnecessary re-renders
  const drawingStageProps = useMemo(
    () => ({
      stageRef,
      selectedTool,
      lines,
      shapes,
      currentLine,
      zoom,
    }),
    [selectedTool, lines, shapes, currentLine, zoom]
  );

  return (
    <div className="flex flex-col md:flex-row h-full w-full bg-gray-300 dark:bg-gray-900 overflow-hidden relative">
      {/* Side toolbox (vertical on desktop, slide-in on mobile) */}
      <div className="hidden md:flex md:w-20 md:relative md:flex-col items-center justify-center left-6">
        <Toolbox onSelectTool={handleSelectTool} activeTool={selectedTool} />
      </div>

      {/* Main content area containing toolbax and canvas */}
      <div className="flex flex-col items-center flex-1 w-full px-4 md:px-6 py-4 md:py-6 overflow-auto">
        {/* Toolbar with undo, redo, clear functionality */}
        <div className="w-full max-w-4xl mb-4">
          <Toolbar
            onUndo={handleUndo}
            onRedo={handleRedo}
            onClear={handleClear}
            stageRef={stageRef}
          />
        </div>

        {/* Toolbox - Mobile (Horizontal below Toolbar) */}
        <div className="flex md:hidden w-full justify-center mb-4">
          <Toolbox onSelectTool={handleSelectTool} activeTool={selectedTool} />
        </div>

        {/* Only show color picker if paint tool is selected */}
        {selectedTool === "paint" && isColorPickerOpen && (
          <div>
            <ColorPickerWrapper onClose={() => setIsColorPickerOpen(false)} />
          </div>
        )}

        {/* Drawing area: canvas rendered using react-konva */}
        <div className="flex w-full max-w-fit flex-1 gap-2 overflow-hidden">
          {/* Canvas Area */}
          <div
            className="flex-1 rounded-2xl shadow-lg border bg-[radial-gradient(#d4d4d4_1px,transparent_1px)] bg-[size:20px_20px] dark:bg-[radial-gradient(#4b5563_1px,transparent_1px)] overflow-hidden transition-transform duration-300 ease-in-out"
            style={{ transformOrigin: "center center" }}
          >
            <DrawingStage {...drawingStageProps} />
          </div>

          {/* Settings Panel */}
          <SettingsPanel selectedTool={selectedTool} />
        </div>
      </div>
    </div>
  );
};

export default Canvas;
