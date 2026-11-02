// Import Line component from react-konva to draw lines on the canvas
import { Line } from "react-konva";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedLineId, updateLinePosition } from "@/store/drawingSlice";
import { dashFor } from "@/lib/strokeStyle";

// Older saved lines have no dashStyle: pencil lines were dashed
function lineDash(line) {
  if (line.dashStyle) return dashFor(line.dashStyle, line.strokeWidth);
  return line.tool === "pencil" ? [line.strokeWidth * 2, line.strokeWidth * 2] : [];
}

/**
 * LineRenderer is responsible for rendering all the user's drawn lines,
 * including completed lines and the line currently being drawn.
 * With the select tool, finished lines can be selected and dragged.
 */
const LineRenderer = ({ lines, currentLine, selectedTool }) => {
  const dispatch = useDispatch();
  const liveLines = useSelector((state) => state.drawing.liveLines);
  const selectedLineId = useSelector((state) => state.drawing.selectedLineId);
  const strokeColor = useSelector((state) => state.drawing.currentStrokeColor);
  const strokeWidth = useSelector((state) => state.drawing.currentStrokeWidth);
  const opacity = useSelector((state) => state.drawing.currentOpacity);
  const dashStyle = useSelector((state) => state.drawing.currentDashStyle);

  const isSelectMode = selectedTool === "select";

  return (
    <>
      {/* Render each completed line from the Redux store */}
      {lines.map((line, index) => (
        <Line
          key={line.id ?? index}
          points={line.points} //  Array of x, y coordinates
          stroke={line.stroke || "black"}
          strokeWidth={line.strokeWidth}
          opacity={line.opacity ?? 1}
          tension={line.tool === "pen" ? 0.5 : 0.2} //  Smoothing factor: pen is smoother
          dash={lineDash(line)}
          lineCap="round" //  Rounded line ends
          lineJoin="round" //  Smooth corner joints
          listening={isSelectMode}
          hitStrokeWidth={Math.max(line.strokeWidth, 14)} // easier to click thin lines
          draggable={isSelectMode}
          shadowColor="#3b82f6"
          shadowBlur={10}
          shadowEnabled={line.id === selectedLineId}
          onClick={() => dispatch(setSelectedLineId(line.id))}
          onTap={() => dispatch(setSelectedLineId(line.id))}
          onDragStart={() => dispatch(setSelectedLineId(line.id))}
          onDragEnd={(e) => {
            // Points are absolute: fold the drag offset into them and reset the node
            const node = e.target;
            dispatch(updateLinePosition({ index, x: node.x(), y: node.y() }));
            node.position({ x: 0, y: 0 });
          }}
        />
      ))}

      {/* Render the line currently being drawn, with the current defaults */}
      {currentLine.length > 0 && (
        <Line
          key="current-line"
          points={currentLine} //  Points array of current line in progress
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          opacity={opacity}
          dash={dashFor(dashStyle, strokeWidth)}
          tension={selectedTool === "pen" ? 0.5 : 0.2}
          lineCap="round"
          lineJoin="round"
          listening={false}
        />
      )}

      {liveLines.map((line, index) => (
        <Line
          key={`live-line-${index}`}
          points={line.points}
          stroke={line.tool === "pen" ? "black" : "#353839"}
          strokeWidth={line.tool === "pen" ? 3 : 1.8}
          opacity={line.tool === "pen" ? 1 : 0.6}
          dash={
            line.tool === "pencil"
              ? [line.strokeWidth * 2, line.strokeWidth * 2]
              : []
          }
          tension={0.5}
          lineCap="round"
          globalCompositeOperation={
            line.tool === "eraser" ? "destination-out" : "source-over"
          }
          listening={false}
        />
      ))}
    </>
  );
};

export default LineRenderer;
