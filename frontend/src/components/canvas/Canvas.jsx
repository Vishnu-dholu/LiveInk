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
  setRoomInfo,
  updateUsers,
  updateCreatedBy,
} from "@/store/drawingSlice";
// Socket instance for real-time collaboration
import { socket } from "@/lib/socket";
import { useSocketListeners } from "@/hooks/useSocketListeners";
import ColorPickerWrapper from "./ColorPickerWrapper";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { MoveLeft, MoveRight } from "lucide-react";
import RightPanelTabs from "./RightPanelTabs";
import InviteLink from "../room/InviteLink";

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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

  const navigate = useNavigate();
  const { roomId } = useParams();
  const location = useLocation();

  const roomPassword =
    new URLSearchParams(location.search).get("password") || "";

  useSocketListeners(socket);

  const stored = localStorage.getItem("user") || sessionStorage.getItem("user");
  const me = stored ? JSON.parse(stored) : {};

  // 1) on-mount & on socket "connect" -> re-join the room
  useEffect(() => {
    if (!roomId || !me.userId) {
      navigate("/join-room");
      return;
    }

    socket.emit(
      "room:join",
      {
        roomId,
        userId: me.userId,
        username: me.username,
        password: roomPassword,
      },
      (resp) => {
        if (!resp.success) {
          console.error("join failed", resp.message);
          navigate("/join-room");
          return;
        }
        // this is the big one:
        setChatHistory(resp.history || []);
        // also update users / createdBy if you like
        dispatch(
          setRoomInfo({ roomId, createdBy: resp.createdBy, users: resp.users })
        );
      }
    );
  }, [roomId, me.userId, me.username, roomPassword]);

  // 2) subscribe to live member updates
  useEffect(() => {
    const onMembers = ({ members, createdBy }) => {
      dispatch(updateUsers(members));
      dispatch(updateCreatedBy(createdBy));
    };
    socket.on("room:members", onMembers);
    return () => {
      socket.off("room:members", onMembers);
    };
  }, [dispatch]);

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
      <div className="absolute top-4 left-1/10 -translate-x-1/2 bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-white px-6 py-3 rounded-lg shadow-lg z-50 backdrop-blur-md border border-gray-300 dark:border-gray-700 w-fit flex flex-col gap-2">
        <InviteLink roomId={roomId} password={roomPassword} />

        <div className="border-t border-gray-300 dark:border-gray-600 w-full" />
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

          <div
            className={`transition-all duration-300 ${
              isCollapsed ? "w-0" : "w-[300px]"
            } h-full relative`}
          >
            <button
              onClick={() => setIsCollapsed((prev) => !prev)}
              className="absolute top-1/2 left-[-40px] z-10 bg-white dark:bg-gray-800 p-1 rounded-lg shadow border-2"
              title={isCollapsed ? "Open Panel" : "Close Panel"}
            >
              {isCollapsed ? <MoveLeft /> : <MoveRight />}
            </button>

            {!isCollapsed && (
              <div className="flex flex-col h-full rounded-2xl bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700">
                <RightPanelTabs
                  selectedTool={selectedTool}
                  initialHistory={chatHistory}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Canvas;
