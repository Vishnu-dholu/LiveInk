// Importing React hooks and necessary functions
import { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

// UI components
import Toolbar from "./Toolbar"; //  Top-bar with undo, redo, clear
import Toolbox from "./Toolbox"; //  Side toolbox with drawing tools
import { Menu } from "lucide-react"; //  Icon component used for mobile menu button
import DrawingStage from "./DrawingStage"; //  The Konva canvas rendering layer
// Redux actions for undo, redo and clearing canvas
import { undoAction, redoAction, clearCanvas } from "@/store/drawingSlice";
// Socket instance for real-time collaboration
import { socket } from "@/lib/socket";

const Canvas = () => {
  const dispatch = useDispatch();
  // Ref to the Konva stage element
  const stageRef = useRef();
  // Local UI state foor toggling mobile toolbox visibilty
  const [isToolboxVisible, setIsToolboxVisible] = useState(false);
  // Tracks the currently selected drawing tool
  const [selectedTool, setSelectedTool] = useState("pencil");

  // Redux state: all drawn lines
  const lines = useSelector((state) => state.drawing.lines);
  // Redux state: all drawn shapes
  const shapes = useSelector((state) => state.drawing.shapes);
  // Redux state: the current line being drawn (live)
  const currentLine = useSelector((state) => state.drawing.currentLine);

  // Destructure returned values from useTextEditing hook
  // const { handleEditText, isEditingText, editTextProps } = useTextEditing(
  //   stageRef,
  //   socket
  // );

  // Handler for tool selection from toolbox
  const handleSelectTool = (tool) => setSelectedTool(tool);

  // Undo action and emit to other users via socket
  const handleUndo = () => {
    dispatch(undoAction());
    socket.emit("undo", { userId: socket.id });
  };

  // Redo action and emit to other users via socket
  const handleRedo = () => {
    dispatch(redoAction());
    socket.emit("redo", { userId: socket.id });
  };

  // Clear canvas and emit to other users
  const handleClear = () => {
    dispatch(clearCanvas());
    socket.emit("clear");
  };

  return (
    <div className="flex flex-col md:flex-row items-center md:items-start justify-center h-full w-full bg-gray-300 dark:bg-gray-900 p-4">
      {/* Hamburger menu icon shown on small screens to toggle toolbox */}
      <div className="md:hidden absolute top-58 left-4 z-50">
        <button
          onClick={() => setIsToolboxVisible(!isToolboxVisible)}
          className="p-2 bg-gray-800 text-white rounded-md"
        >
          <Menu size={28} />
        </button>
      </div>

      {/* Side toolbox (vertical on desktop, slide-in on mobile) */}
      <div
        className={`fixed md:relative md:w-20 w-full md:h-auto mt-6 top-50 left-1 flex md:flex-col justify-center md:justify-start transition-transform duration-300 ease-in-out ${
          isToolboxVisible ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:flex md:flex-col md:items-center`}
      >
        <Toolbox onSelectTool={handleSelectTool} activeTool={selectedTool} />
      </div>

      {/* Main content area containing toolbax and canvas */}
      <div className="flex flex-col items-center flex-1 w-full max-w-screen-xl px-4">
        {/* Toolbar with undo, redo, clear functionality */}
        <Toolbar
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClear={handleClear}
        />

        {/* Drawing area: canvas rendered using react-konva */}
        <div className="relative w-full max-w-6xl max-h-[80vh] shadow-lg rounded-xl border bg-gray-100 dark:bg-gray-400 border-gray-300 dark:border-gray-700 overflow-hidden">
          <DrawingStage
            stageRef={stageRef} //  Reference to Konva stage
            selectedTool={selectedTool} //  Current tool selected from toolbox
            lines={lines} //  All saved lines
            shapes={shapes} //  All saved shapes
            currentLine={currentLine} //  Line currently being drawn
            // handleEditText={handleEditText} //  Start editing text on double-click
            // editTextProps={editTextProps} //  Data for current editable text
            // isEditingText={isEditingText} //  Whether user is editing any text
          />
        </div>
      </div>
    </div>
  );
};

export default Canvas;
