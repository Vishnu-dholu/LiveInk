import { Stage, Layer } from "react-konva";
import LineRenderer from "./LineRenderer";
import ShapeRenderer from "./ShapeRenderer";
import TextRenderer from "./TextRenderer";
import useCanvasEvents from "./useCanvasEvents";
import useTextEditing from "./useTextEditing";

const DrawingStage = ({
  stageRef,
  selectedTool,
  lines,
  shapes,
  currentLine,
  handleEditText,
  editTextProps,
  isEditingText,
}) => {
  const { handleMouseDown, handleMouseMove, handleMouseUp, currentShape } =
    useCanvasEvents({ selectedTool, stageRef });
  return (
    <Stage
      width={window.innerWidth * 0.8}
      height={window.innerHeight * 0.8}
      ref={stageRef}
      className="rounded-lg bg-white dark:bg-gray-400"
      style={{ borderRadius: "12px" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <Layer>
        {/* Lines drawn with Pencil/Pen/Marker */}
        <LineRenderer lines={lines} currentLine={currentLine} />

        {/* Static and live shapes like rectangles, stars, etc. */}
        <ShapeRenderer shapes={shapes} currentShape={currentShape} />

        {/* Committed + editing text */}
        <TextRenderer
          isEditingText={isEditingText}
          editTextProps={editTextProps}
          onEdit={handleEditText}
        />
      </Layer>
    </Stage>
  );
};

export default DrawingStage;
