// Import Konva components
import { Stage, Layer } from "react-konva";

// Renderers for different types of drawable elements
import LineRenderer from "./LineRenderer";
import ShapeRenderer from "./ShapeRenderer";
import TextRenderer from "./TextRenderer";

// Custom hooks for handling canvas interactions
import useCanvasEvents from "../../hooks/useCanvasEvents"; //  Manages mouse drawing events
import useTextEditing from "../../hooks/useTextEditing"; //  Manages in-place text editing logic
import { setStagePosition } from "@/store/drawingSlice";

// Socket instance for real-time syncing
import { socket } from "@/lib/socket";
import { useDispatch, useSelector } from "react-redux";
import GridLayer from "./GridLayer";

const DrawingStage = ({
  stageRef, //  Ref to the Konva stage for accessing methods or dimensions
  selectedTool, //  Tool currently selected
  lines, //  All saved freehand lines
  shapes, //  All saved shapes
  currentLine, //  The line currently being drawn
  zoom,
}) => {
  const dispatch = useDispatch();
  // Hook to manage mouse-based drawing logic (down, move, up)
  const { handleMouseDown, handleMouseMove, handleMouseUp, currentShape } =
    useCanvasEvents({ selectedTool, stageRef });

  // Hook to manage double-click text editing functionality
  const {
    handleEditText,
    isEditingText,
    editTextProps,
    handleUpdateTextPosition,
  } = useTextEditing(stageRef, socket);

  const stageX = useSelector((state) => state.drawing.scaleX);
  const stageY = useSelector((state) => state.drawing.scaleY);
  const showGrid = useSelector((state) => state.drawing.showGrid);

  const width = window.innerWidth;
  const height = window.innerHeight;

  const isPanning = selectedTool === "select";

  const handleStageMouseDown = (e) => {
    const stage = e.target.getStage();
    const clickedOnEmpty = e.target === stage;

    if (stage && isPanning) {
      stage.draggable(clickedOnEmpty);
    }

    // Trigger drawing logic if not panning
    if (!isPanning) {
      handleMouseDown(e);
    }
  };

  const handleStageMouseMove = (e) => {
    if (!isPanning) handleMouseMove(e);
  };

  const handleStageMouseUp = (e) => {
    if (!isPanning) handleMouseUp(e);
  };

  // Update stage position when dragging ends (only in select mode)
  const handleDragEnd = (e) => {
    // Only update position if canvas itself was dragged
    if (isPanning && e.target === e.target.getStage()) {
      dispatch(setStagePosition({ x: e.target.x(), y: e.target.y() }));
    }
  };

  return (
    <Stage
      width={width}
      height={height}
      scaleX={zoom}
      scaleY={zoom}
      x={stageX}
      y={stageY}
      ref={stageRef} //  Assign the stageRef so Konva APIs can be used
      className="rounded-lg bg-white dark:bg-gray-400"
      onDragEnd={handleDragEnd}
      style={{ borderRadius: "12px", cursor: isPanning ? "grab" : "crosshair" }}
      onMouseDown={handleStageMouseDown} //  Start drawing (line or shape)
      onMouseMove={handleStageMouseMove} //  Draw as the mouse moves
      onMouseUp={handleStageMouseUp} //  Complete the drawing action
    >
      {showGrid && <GridLayer width={10000} height={10000} />}
      <Layer>
        {/* Render all previous and current freehand lines  */}
        <LineRenderer lines={lines} currentLine={currentLine} />

        {/* Render all previous and current freehand lines  */}
        <ShapeRenderer
          shapes={shapes}
          currentShape={currentShape}
          selectedTool={selectedTool}
        />

        {/* Render static text elements and handle live editing */}
        <TextRenderer
          isEditingText={isEditingText} //  If true, show editable textarea
          editTextProps={editTextProps} //  Props for currently edited text
          onEdit={(updatedText) => {
            if (updatedText.isDrag) {
              handleUpdateTextPosition(updatedText);
            } else {
              handleEditText(updatedText);
            }
          }}
          socket={socket}
        />
      </Layer>
    </Stage>
  );
};

export default DrawingStage;
