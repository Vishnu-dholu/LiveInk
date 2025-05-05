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
  updateUsers,
  updateCreatedBy,
} from "@/store/drawingSlice";
// Socket instance for real-time collaboration
import { socket } from "@/lib/socket";
import { useSocketListeners } from "@/hooks/useSocketListeners";
import ColorPickerWrapper from "./ColorPickerWrapper";
import SettingsPanel from "./SettingsPanel";
import { useLocation, useParams } from "react-router-dom";
import { Copy } from "lucide-react";
import RoomUsersList from "./RoomUsersList";

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

  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false); // Manage color picker
  const [roomIdCopied, setRoomIdCopied] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);

  const { roomId } = useParams();
  const location = useLocation();

  const urlParams = new URLSearchParams(location.search);
  const roomPassword = urlParams.get("password");

  // useEffect(() => {
  //   const handleMembers = ({ members, createdBy }) => {
  //     const valid = (members || []).filter((u) => u?.userId && u?.username);
  //     dispatch(updateUsers(valid));
  //     dispatch(updateCreatedBy(createdBy));
  //   };

  //   socket.on("room:members", handleMembers);

  //   socket.emit("room:members", { roomId }, (response) => {
  //     if (response.success) {
  //       handleMembers({
  //         members: response.members,
  //         createdBy: response.createdBy,
  //       });
  //     }
  //   });

  //   return () => socket.off("room:members", handleMembers``);
  // }, [roomId, dispatch]);

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

  const handleCopyRoomId = (text) => {
    navigator.clipboard.writeText(text);
    setRoomIdCopied(true);
    setTimeout(() => setRoomIdCopied(false), 1500);
  };

  const handleCopyPassword = (text) => {
    navigator.clipboard.writeText(text);
    setPasswordCopied(true);
    setTimeout(() => setPasswordCopied(false), 1500);
  };

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
      <div className="absolute top-4 left-1/10 -translate-x-1/2 bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-white px-6 py-3 rounded-lg shadow-lg z-50 backdrop-blur-md border border-gray-300 dark:border-gray-700 w-fit flex flex-col gap-2">
        {/* Room ID display */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">Room ID:</span>
          <span className="font-mono text-sm rounded px-2 py-0.5 dark:bg-gray-700 bg-gray-200">
            {roomId}
          </span>
          <button
            className="hover:text-blue-600 dark:hover:text-blue-400"
            onClick={() => handleCopyRoomId(roomId)}
            title="Copy Room ID"
          >
            <Copy size={16} />
          </button>
          {roomIdCopied && (
            <span className="text-xs text-green-500 ml-2">Copied!</span>
          )}
        </div>

        <div className="border-t border-gray-300 dark:border-gray-600 w-full" />

        {/* Room Password */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">Password:</span>
          <span className="font-mono text-sm px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700">
            {roomPassword || "N/A"}
          </span>
          <button
            className="hover:text-blue-600 dark:hover:text-blue-400"
            onClick={() => handleCopyPassword(roomPassword)}
            title="Copy Room ID"
          >
            <Copy size={16} />
          </button>
          {passwordCopied && (
            <span className="text-xs text-green-500 ml-2">Copied!</span>
          )}
        </div>
      </div>

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
            className="flex-1 rounded-2xl shadow-lg border bg-[radial-gradient(#d4d4d4_1px,transparent_1px)] bg-[size:20px_20px] dark:bg-[radial-gradient(#4b5563_1px,transparent_1px)] overflow-hidden transition-transform duration-500 ease-in-out"
            style={{ transformOrigin: "center center" }}
          >
            <DrawingStage {...drawingStageProps} />
          </div>

          <div className="flex flex-col gap-2">
            <SettingsPanel selectedTool={selectedTool} />
            <RoomUsersList />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Canvas;
