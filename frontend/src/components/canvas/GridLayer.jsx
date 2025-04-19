import { Layer, Line } from "react-konva";
import { useSelector } from "react-redux";

/**
 *  GridLayer component overlays a grid background on the canvas.
 *  It dynamically adjusts according to zoom and pan to create
 *  an infinite-scrolling grid experience.
 */
const GridLayer = ({ width, height, gridSize = 50, zoom }) => {
  const scaledGridSize = gridSize * zoom;

  const lines = [];

  // Create vertical lines
  for (let x = 0; x < width / zoom; x += scaledGridSize) {
    lines.push(
      <Line
        key={`v-${x}`}
        points={[x, 0, x, height / zoom]}
        stroke="#e0e0e0"
        strokeWidth={1 / zoom}
      />
    );
  }

  // Create horizontal lines
  for (let y = 0; y < height / zoom; y += scaledGridSize) {
    lines.push(
      <Line
        key={`h-${y}`}
        points={[0, y, width / zoom, y]}
        stroke="#e0e0e0"
        strokeWidth={1 / zoom}
      />
    );
  }

  return <Layer listening={false}>{lines}</Layer>;
};

export default GridLayer;
