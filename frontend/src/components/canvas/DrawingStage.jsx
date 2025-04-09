// Import Konva components
import { Stage, Layer } from "react-konva";

// Renderers for different types of drawable elements
import LineRenderer from "./LineRenderer";
import ShapeRenderer from "./ShapeRenderer";
import TextRenderer from "./TextRenderer";

// Custom hooks for handling canvas interactions
import useCanvasEvents from "./useCanvasEvents"; //  Manages mouse drawing events
import useTextEditing from "./useTextEditing"; //  Manages in-place text editing logic

// Socket instance for real-time syncing
import { socket } from "@/lib/socket";

const DrawingStage = ({
  stageRef, //  Ref to the Konva stage for accessing methods or dimensions
  selectedTool, //  Tool currently selected
  lines, //  All saved freehand lines
  shapes, //  All saved shapes
  currentLine, //  The line currently being drawn
}) => {
  // Hook to manage mouse-based drawing logic (down, move, up)
  const { handleMouseDown, handleMouseMove, handleMouseUp, currentShape } =
    useCanvasEvents({ selectedTool, stageRef });

  // Hook to manage double-click text editing functionality
  const { handleEditText, isEditingText, editTextProps } = useTextEditing(
    stageRef,
    socket
  );
  return (
    <Stage
      width={window.innerWidth * 0.8}
      height={window.innerHeight * 0.8}
      ref={stageRef} //  Assign the stageRef so Konva APIs can be used
      className="rounded-lg bg-white dark:bg-gray-400"
      style={{ borderRadius: "12px" }}
      onMouseDown={handleMouseDown} //  Start drawing (line or shape)
      onMouseMove={handleMouseMove} //  Draw as the mouse moves
      onMouseUp={handleMouseUp} //  Complete the drawing action
    >
      <Layer>
        {/* Render all previous and current freehand lines  */}
        <LineRenderer lines={lines} currentLine={currentLine} />

        {/* Render all previous and current freehand lines  */}
        <ShapeRenderer shapes={shapes} currentShape={currentShape} />

        {/* Render static text elements and handle live editing */}
        <TextRenderer
          isEditingText={isEditingText} //  If true, show editable textarea
          editTextProps={editTextProps} //  Props for currently edited text
          onEdit={handleEditText} //  Function to handle double-click editing
        />
      </Layer>
    </Stage>
  );
};

export default DrawingStage;
