// Import Rect (rectangle shape) component from react-konva
import { socket } from "@/lib/socket";
import {
  setSelectedShapeId,
  updateShapeTransform,
  updateShapePosition,
} from "@/store/drawingSlice";
import { useEffect, useRef } from "react";
import { Rect, Circle, Transformer } from "react-konva";
import { useDispatch, useSelector } from "react-redux";

/**
 * ShapeRenderer is responsible for rendering all static shapes
 * (like reactangles) as well as a live preview of the currently being drawn.
 */
const ShapeRenderer = ({ currentShape, selectedTool }) => {
  const dispatch = useDispatch();

  //  Get all finalized shapes from Redux store
  const shapes = useSelector((state) => state.drawing.shapes);
  const selectedShapeId = useSelector((state) => state.drawing.selectedShapeId);

  // Refs for Transformer and shape instances
  const transformerRef = useRef(null);
  const shapeRefs = useRef([]);

  // Attach Transformer to the selected shape
  useEffect(() => {
    if (transformerRef.current && selectedShapeId !== null) {
      const selectedNode = shapeRefs.current[selectedShapeId];

      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer().batchDraw();
      } else {
        // Optional: helpful for debugging
        console.warn(
          "Transformer node not found for shape id",
          selectedShapeId
        );
      }
    }
  }, [selectedShapeId, shapes]);

  // Deselect shape on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        dispatch(setSelectedShapeId(null));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dispatch]);

  return (
    <>
      {/* Transparent rect for catching deselection clicks */}
      <Rect
        x={0}
        y={0}
        width={window.innerWidth}
        height={window.innerHeight}
        fill="transparent"
        listening={true}
        onMouseDown={() => {
          if (selectedTool === "select") {
            dispatch(setSelectedShapeId(null));
          }
        }}
      />
      {/* Render all previously drawn shapes */}
      {shapes.map((shape, index) => {
        const commonProps = {
          x: shape.x,
          y: shape.y,
          stroke: "black",
          strokeWidth: 2,
          draggable: selectedTool === "select",
          onClick: () => {
            if (selectedTool === "select") dispatch(setSelectedShapeId(index));
          },

          onTransformEnd: (e) => {
            const node = e.target;
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();

            const updatedShape = {
              ...shape,
              x: node.x(),
              y: node.y(),
              width: shape.width * scaleX,
              height: shape.height * scaleY,
            };

            // Reset transform scale after applying
            node.scaleX(1);
            node.scaleY(1);

            dispatch(updateShapeTransform({ id: shape.id, updatedShape }));
            socket.emit("shape:update", { id: shape.id, updatedShape });
          },

          onDragEnd: (e) => {
            const { x, y } = e.target.position();

            const updatedShape = {
              ...shape,
              x,
              y,
            };

            dispatch(updateShapeTransform({ id: shape.id, updatedShape }));
            socket.emit("shape:update", { id: shape.id, updatedShape });
          },

          ref: (el) => (shapeRefs.current[index] = el),
        };

        return shape.tool === "circle" ? (
          <Circle key={index} {...commonProps} radius={shape.radius} />
        ) : (
          <Rect
            key={index}
            {...commonProps}
            width={shape.width}
            height={shape.height}
          />
        );
      })}

      {/* Add Transformer for the selected shape */}
      {selectedShapeId !== null && <Transformer ref={transformerRef} />}

      {/* Render the shape currently beingn drawn */}
      {currentShape &&
        (selectedTool === "circle" ? (
          <Circle
            x={currentShape.x}
            y={currentShape.y}
            radius={currentShape.radius}
            stroke="black"
            strokeWidth={2}
            dash={[10, 5]}
            draggable={selectedTool === "select"}
            onDragEnd={(e) => {
              const { x, y } = e.target.position();
              const updatedShape = {
                ...shapes[index],
                x,
                y,
              };
              dispatch(updateShapePosition({ index, updatedShape }));
              socket.emit("shape:update", { index, updatedShape });
            }}
          />
        ) : (
          <Rect
            x={currentShape.x}
            y={currentShape.y}
            width={currentShape.width}
            height={currentShape.height}
            stroke="black"
            strokeWidth={2}
            dash={[10, 5]} //  Dotted line for preview
            draggable={selectedTool === "select"}
            onDragEnd={(e) => {
              const { x, y } = e.target.position();
              dispatch(updateShapePosition({ index, x, y }));
              socket.emit("shape:update", { index, x, y });
            }}
          />
        ))}
    </>
  );
};

export default ShapeRenderer;
