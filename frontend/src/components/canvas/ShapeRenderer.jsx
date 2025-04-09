// Import Rect (rectangle shape) component from react-konva
import { Rect } from "react-konva";
import { useSelector } from "react-redux";

/**
 * ShapeRenderer is responsible for rendering all static shapes
 * (like reactangles) as well as a live preview of the currently being drawn.
 */
const ShapeRenderer = ({ currentShape }) => {
  //  Get all finalized shapes from Redux store
  const shapes = useSelector((state) => state.drawing.shapes);

  return (
    <>
      {/* Render all previously drawn shapes */}
      {shapes.map((shape, index) => (
        <Rect
          key={index} //  Unique key for each shape
          x={shape.x} //  Top-left x coordinate
          y={shape.y} //  Top-left y coordinate
          width={shape.width} //  Width of the rectangle
          height={shape.height} //  Height of the rectangle
          stroke="black"
          strokeWidth={2}
        />
      ))}

      {/* Render the shape currently beingn drawn */}
      {currentShape && (
        <Rect
          x={currentShape.x}
          y={currentShape.y}
          width={currentShape.width}
          height={currentShape.height}
          stroke="black"
          strokeWidth={2}
          dash={[10, 5]} //  Dotted line for preview
        />
      )}
    </>
  );
};

export default ShapeRenderer;
