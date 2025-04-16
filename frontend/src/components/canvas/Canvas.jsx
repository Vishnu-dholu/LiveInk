// Importing React hooks and necessary functions
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

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
} from "@/store/drawingSlice";
// Socket instance for real-time collaboration
import { socket } from "@/lib/socket";
import { useSocketListeners } from "@/hooks/useSocketListeners";

// Constants for large virtual canvas
const virtualCanvasWidth = 10000;
const virtualCanvasHeight = 10000;

const Canvas = () => {
  const dispatch = useDispatch();
  // Ref to the Konva stage element
  const stageRef = useRef();
  // Tracks the currently selected drawing tool
  const [selectedTool, setSelectedTool] = useState("select");

  // Redux state: all drawn lines
  const lines = useSelector((state) => state.drawing.lines);
  // Redux state: all drawn shapes
  const shapes = useSelector((state) => state.drawing.shapes);
  // Redux state: the current line being drawn (live)
  const currentLine = useSelector((state) => state.drawing.currentLine);
  const zoom = useSelector((state) => state.drawing.zoom);

  // Register socket listeners (text, drawing, undo, etc.)
  useSocketListeners(socket);

  const centerStage = useCallback(() => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    const offsetX = screenWidth / 2 - (virtualCanvasWidth * zoom) / 2;
    const offsetY = screenHeight / 2 - (virtualCanvasHeight * zoom) / 2;

    dispatch(setStagePosition({ x: offsetX, y: offsetY }));
  }, [zoom, dispatch]);

  useEffect(() => {
    centerStage();
    window.addEventListener("resize", centerStage);
    return () => window.removeEventListener("resize", centerStage);
  }, [centerStage]);

  // Handler for tool selection from toolbox
  const handleSelectTool = (tool) => setSelectedTool(tool);

  // Undo action and emit to other users via socket
  const handleUndo = () => {
    dispatch(undoAction());
    dispatch(updateCurrentLine([]));
    dispatch(updateCurrentShape([]));
    socket.emit("undo", { userId: socket.id });
  };

  // Redo action and emit to other users via socket
  const handleRedo = () => {
    dispatch(redoAction());
    dispatch(updateCurrentLine([]));
    dispatch(updateCurrentShape([]));
    socket.emit("redo", { userId: socket.id });
  };

  // Clear canvas and emit to other users
  const handleClear = () => {
    dispatch(clearCanvas());
    dispatch(updateCurrentLine([]));
    dispatch(updateCurrentShape([]));
    socket.emit("clear");
  };

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
          />
        </div>

        {/* Toolbox - Mobile (Horizontal below Toolbar) */}
        <div className="flex md:hidden w-full justify-center mb-4">
          <Toolbox onSelectTool={handleSelectTool} activeTool={selectedTool} />
        </div>

        {/* Drawing area: canvas rendered using react-konva */}
        <div className="w-full max-w-6xl flex-1 h-full rounded-xl shadow-lg border bg-gray-100 dark:bg-gray-400 border-gray-300 dark:border-gray-700 overflow-hidden">
          <DrawingStage
            stageRef={stageRef} //  Reference to Konva stage
            selectedTool={selectedTool} //  Current tool selected from toolbox
            lines={lines} //  All saved lines
            shapes={shapes} //  All saved shapes
            currentLine={currentLine} //  Line currently being drawn
            zoom={zoom}
          />
        </div>
      </div>
    </div>
  );
};

export default Canvas;
