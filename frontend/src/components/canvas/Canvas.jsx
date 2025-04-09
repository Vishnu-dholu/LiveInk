import { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Toolbar from "./Toolbar";
import Toolbox from "./Toolbox";
import { Menu } from "lucide-react";
import DrawingStage from "./DrawingStage";
import { undoAction, redoAction, clearCanvas } from "@/store/drawingSlice";
import { socket } from "@/lib/socket";
import useTextEditing from "./useTextEditing";

const Canvas = () => {
  const dispatch = useDispatch();
  const stageRef = useRef();
  const [isToolboxVisible, setIsToolboxVisible] = useState(false);
  const [selectedTool, setSelectedTool] = useState("pencil");

  const lines = useSelector((state) => state.drawing.lines);
  const shapes = useSelector((state) => state.drawing.shapes);
  const currentLine = useSelector((state) => state.drawing.currentLine);

  const { handleEditText, isEditingText, editTextProps } = useTextEditing(
    stageRef,
    socket
  );

  const handleSelectTool = (tool) => setSelectedTool(tool);

  const handleUndo = () => {
    dispatch(undoAction());
    socket.emit("undo", { userId: socket.id });
  };

  const handleRedo = () => {
    dispatch(redoAction());
    socket.emit("redo", { userId: socket.id });
  };

  const handleClear = () => {
    dispatch(clearCanvas());
    socket.emit("clear");
  };

  return (
    <div className="flex flex-col md:flex-row items-center md:items-start justify-center h-full w-full bg-gray-300 dark:bg-gray-900 p-4">
      <div className="md:hidden absolute top-58 left-4 z-50">
        <button
          onClick={() => setIsToolboxVisible(!isToolboxVisible)}
          className="p-2 bg-gray-800 text-white rounded-md"
        >
          <Menu size={28} />
        </button>
      </div>

      <div
        className={`fixed md:relative md:w-20 w-full md:h-auto mt-6 top-50 left-1 flex md:flex-col justify-center md:justify-start transition-transform duration-300 ease-in-out ${
          isToolboxVisible ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:flex md:flex-col md:items-center`}
      >
        <Toolbox onSelectTool={handleSelectTool} activeTool={selectedTool} />
      </div>

      <div className="flex flex-col items-center flex-1 w-full max-w-screen-xl px-4">
        <Toolbar
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClear={handleClear}
        />
        <div className="relative w-full max-w-6xl max-h-[80vh] shadow-lg rounded-xl border bg-gray-100 dark:bg-gray-400 border-gray-300 dark:border-gray-700 overflow-hidden">
          <DrawingStage
            stageRef={stageRef}
            selectedTool={selectedTool}
            lines={lines}
            shapes={shapes}
            currentLine={currentLine}
            handleEditText={handleEditText}
            editTextProps={editTextProps}
            isEditingText={isEditingText}
          />
        </div>
      </div>
    </div>
  );
};

export default Canvas;
