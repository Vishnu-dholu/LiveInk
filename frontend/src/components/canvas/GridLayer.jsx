import { Layer, Line } from "react-konva";
import { useSelector } from "react-redux";

/**
 *  GridLayer component overlays a grid background on the canvas.
 *  It dynamically adjusts according to zoom and pan to create
 *  an infinite-scrolling grid experience.
 */
const GridLayer = ({ width, height, gridSize = 50 }) => {
  // Get zoom and stage position from Redux state
  const zoom = useSelector((state) => state.drawing.zoom);
  const stageX = useSelector((state) => state.drawing.stageX);
  const stageY = useSelector((state) => state.drawing.stageY);

  const scaledGridSize = gridSize * zoom;

  const verticalLines = [];
  const horizontalLines = [];

  // Calculate where the first vertical line should start based on pan
  const startX = -stageX % scaledGridSize;
  const startY = -stageY % scaledGridSize;

  // Generate vertical grid lines
  for (let x = startX; x < width; x += scaledGridSize) {
    verticalLines.push(
      <Line
        key={`v-${x}`}
        points={[x, 0, x, height]}
        stroke="#e0e0e0"
        strokeWidth={1}
      />
    );
  }

  // Generate horizontal grid lines
  for (let y = startY; y < height; y += scaledGridSize) {
    horizontalLines.push(
      <Line
        key={`h-${y}`}
        points={[0, y, width, y]}
        stroke="#e0e0e0"
        strokeWidth={1}
      />
    );
  }

  return (
    // The grid is static and doesn't receive pointer events
    <Layer listening={false}>{[...verticalLines, ...horizontalLines]}</Layer>
  );
};

export default GridLayer;
