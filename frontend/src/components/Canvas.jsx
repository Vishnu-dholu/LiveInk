// import { useEffect, useRef, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { Stage, Layer, Line, Rect, Text } from "react-konva";
// import { v4 as uuidv4 } from "uuid";
// import {
//   addLine,
//   drawShape,
//   updateCurrentLine,
//   clearCanvas,
//   redoAction,
//   undoAction,
//   removeLineAt,
//   addText,
//   updateCurrentText,
//   commitCurrentText,
//   updateTextContent,
// } from "../store/drawingSlice";
// import io from "socket.io-client";
// import Toolbar from "./Toolbar";
// import Toolbox from "./Toolbox";
// import { Menu } from "lucide-react";

// const socket = io("http://localhost:5000");

// const Canvas = () => {
//   const dispatch = useDispatch();
//   const lines = useSelector((state) => state.drawing.lines);
//   const shapes = useSelector((state) => state.drawing.shapes);
//   const texts = useSelector((state) => state.drawing.texts);
//   const currentLine = useSelector((state) => state.drawing.currentLine);
//   const currentText = useSelector((state) => state.drawing.currentText);

//   const [canvasWidth, setCanvasWidth] = useState(window.innerWidth - 100);
//   const [canvasHeight, setCanvasHeight] = useState(window.innerHeight - 100);
//   const [isToolboxVisible, setIsToolboxVisible] = useState(false);
//   const [selectedTool, setSelectedTool] = useState("pencil");

//   const [currentShape, setCurrentShape] = useState(null);
//   const [isMouseDown, setIsMouseDown] = useState(false);
//   const [isEditingText, setIsEditingText] = useState(false);
//   const [editTextProps, setEditTextProps] = useState(null);

//   const stageRef = useRef();

//   useEffect(() => {
//     const updateSize = () => {
//       setCanvasWidth(window.innerWidth - 200);
//       setCanvasHeight(window.innerHeight - 100);
//     };
//     window.addEventListener("resize", updateSize);
//     return () => window.removeEventListener("resize", updateSize);
//   }, []);

//   const handleMouseDown = (e) => {
//     const pos = e.target.getStage().getPointerPosition();
//     setIsMouseDown(true);
//     if (isEditingText) return;

//     const clickedOnText = texts.some((t) => {
//       const textWidth = t.text.length * (t.fontSize * 0.6);
//       const textHeight = t.fontSize;
//       return (
//         pos.x >= t.x &&
//         pos.x <= t.x + textWidth &&
//         pos.y >= t.y &&
//         pos.y <= t.y + textHeight
//       );
//     });

//     if (selectedTool === "pen" || selectedTool === "pencil") {
//       dispatch(updateCurrentLine([pos.x, pos.y])); // Start drawing
//     } else if (selectedTool === "square" || selectedTool === "rectangle") {
//       // Start drawing a shape
//       setCurrentShape({ x: pos.x, y: pos.y, width: 0, height: 0 });
//     } else if (selectedTool === "eraser") {
//       dispatch(removeLineAt({ x: pos.x, y: pos.y }));
//       socket.emit("erase", { x: pos.x, y: pos.y });
//     } else if (
//       selectedTool === "text" &&
//       !clickedOnText &&
//       !currentText?.text
//     ) {
//       const newText = {
//         id: uuidv4(),
//         x: pos.x,
//         y: pos.y,
//         text: "Type here...",
//         fontSize: 17,
//         draggable: true,
//       };

//       dispatch(updateCurrentText(newText));
//       socket.emit("text:start", newText);
//     }
//   };

//   const handleMouseMove = (e) => {
//     if (!isMouseDown) return;

//     const pos = e.target.getStage().getPointerPosition();

//     if (selectedTool === "pen" || selectedTool === "pencil") {
//       if (currentLine.length > 0) {
//         dispatch(updateCurrentLine([...currentLine, pos.x, pos.y]));
//       }
//     } else if (selectedTool === "square" && currentShape) {
//       const size = Math.max(
//         Math.abs(pos.x - currentShape.x),
//         Math.abs(pos.y - currentShape.y)
//       );
//       setCurrentShape({
//         ...currentShape,
//         width: size,
//         height: size,
//       });
//     } else if (selectedTool === "rectangle" && currentShape) {
//       setCurrentShape({
//         ...currentShape,
//         width: pos.x - currentShape.x,
//         height: pos.y - currentShape.y,
//       });
//     } else if (selectedTool === "eraser") {
//       dispatch(removeLineAt({ x: pos.x, y: pos.y }));
//       socket.emit("erase", { x: pos.x, y: pos.y });
//     }
//   };

//   const handleMouseUp = () => {
//     setIsMouseDown(false);

//     if (selectedTool === "pen" || selectedTool === "pencil") {
//       if (currentLine.length > 0) {
//         const newLine = {
//           points: [...currentLine],
//           tool: selectedTool,
//           stroke: selectedTool === "pen" ? "black" : "#353839",
//           strokeWidth: selectedTool === "pen" ? 3 : 1.8,
//           opacity: selectedTool === "pen" ? 1 : 0.6,
//         };
//         dispatch(addLine(newLine));
//         socket.emit("draw", newLine);
//         dispatch(updateCurrentLine([])); // Reset for next stroke
//       }
//     } else if (selectedTool === "square" || selectedTool === "rectangle") {
//       if (currentShape) {
//         dispatch(drawShape(currentShape));
//         socket.emit("drawShape", currentShape);
//         setCurrentShape(null);
//       }
//     } else if (selectedTool === "text" && currentText) {
//       dispatch(commitCurrentText());
//       socket.emit("text:commit", currentText);
//     }
//   };

//   const handleUndo = () => {
//     dispatch(undoAction());
//     socket.emit("undo", { userId: socket.id });
//   };

//   const handleRedo = () => {
//     dispatch(redoAction());
//     socket.emit("redo", { userId: socket.id });
//   };

//   const handleClear = () => {
//     dispatch(clearCanvas());
//     socket.emit("clear");
//   };

//   const handleSelectTool = (tool) => {
//     setSelectedTool(tool);
//   };

//   const handleEditText = (textObj) => {
//     setIsEditingText(true);
//     setEditTextProps(textObj);

//     const stage = stageRef.current?.getStage();
//     if (!stage) return;

//     const textNode = stage.findOne(`#${textObj.id}`);
//     const textRect = textNode.getClientRect();
//     const stageBox = stage.container().getBoundingClientRect();

//     const areaPosition = {
//       x: stageBox.left + textRect.x,
//       y: stageBox.top + textRect.y,
//     };

//     const textarea = document.createElement("textarea");
//     textarea.value = textObj.text;

//     textarea.style.position = "absolute";
//     textarea.style.top = `${areaPosition.y}px`;
//     textarea.style.left = `${areaPosition.x}px`;
//     textarea.style.width = `${textRect.width}px`;
//     textarea.style.height = `${textRect.height}px`;
//     textarea.style.fontSize = `${textObj.fontSize}px`;
//     textarea.style.fontFamily = textObj.fontFamily || "Arial";
//     textarea.style.fontWeight = textObj.fontStyle || "normal";
//     textarea.style.textAlign = textObj.align || "left";
//     textarea.style.border = "none";
//     textarea.style.background = "transparent";
//     textarea.style.outline = "none";
//     textarea.style.color = "#000";
//     textarea.style.padding = "0";
//     textarea.style.margin = "0";
//     textarea.style.overflow = "hidden";
//     textarea.style.resize = "none";
//     textarea.style.zIndex = 1000;

//     textarea.style.minWidth = "100px";
//     textarea.style.minHeight = `${textObj.fontSize + 6}px`;
//     textarea.style.width = `${textRect.width}px`;
//     textarea.style.height = `${textRect.height}px`;

//     document.body.appendChild(textarea);
//     textarea.focus();

//     const resizeTextarea = () => {
//       textarea.style.width = "auto";
//       textarea.style.height = "auto";
//       textarea.style.width = `${textarea.scrollWidth + 2}px`;
//       textarea.style.height = `${textarea.scrollHeight + 2}px`;
//     };

//     textarea.addEventListener("input", resizeTextarea);
//     resizeTextarea();

//     textarea.addEventListener("keydown", (e) => {
//       if (e.key === "Enter") {
//         e.preventDefault();
//         textarea.blur();
//       }
//     });

//     textarea.addEventListener("blur", () => {
//       if (textarea.value !== textObj.text) {
//         dispatch(updateTextContent({ id: textObj.id, text: textarea.value }));
//         socket.emit("text:update", { id: textObj.id, text: textarea.value });
//       }
//       document.body.removeChild(textarea);
//       setIsEditingText(false);
//     });
//   };

//   const handleTextDragEnd = (e, textObj) => {
//     const { x, y } = e.target.position();

//     const updatedText = {
//       ...textObj,
//       x,
//       y,
//     };

//     dispatch(updateTextContent(updatedText));
//     socket.emit("text:update", updatedText);
//   };

//   // Sync Redux with WebSocket events
//   useEffect(() => {
//     if (!socket) return;

//     const handleTextStart = (text) => {
//       if (text?.id && typeof text.text === "string") {
//         dispatch(updateCurrentText(text));
//       }
//     };

//     const handleTextCommit = (text) => {
//       if (text?.id && typeof text.text === "string") {
//         dispatch(addText(text));
//       }
//     };

//     socket.on("text:start", handleTextStart);
//     socket.on("text:commit", handleTextCommit);

//     socket.on("draw", (newLine) => {
//       dispatch(addLine(newLine));
//     });

//     socket.on("drawShape", (shape) => {
//       dispatch(drawShape(shape));
//     });

//     socket.on("undo", (data) => {
//       if (data.userId !== socket.id) {
//         dispatch(undoAction());
//       }
//     });

//     socket.on("redo", (data) => {
//       if (data.userId !== socket.id) {
//         dispatch(redoAction());
//       }
//     });

//     socket.on("clear", () => {
//       dispatch(clearCanvas());
//     });

//     socket.on("erase", (pos) => {
//       console.log("Received Erase at:", pos);
//       dispatch(removeLineAt(pos));
//     });

//     socket.on("text:update", (updatedText) => {
//       dispatch(updateTextContent(updatedText));
//     });

//     return () => {
//       socket.off("draw");
//       socket.off("drawShape");
//       socket.off("undo");
//       socket.off("redo");
//       socket.off("clear");
//       socket.off("erase");
//       socket.off("addText");
//       socket.off("text:commit");
//       socket.off("text:start", handleTextStart);
//       socket.off("text:update", handleTextCommit);
//     };
//   }, [dispatch]);

//   return (
//     <div className="flex flex-col md:flex-row items-center md:items-start justify-center h-full w-full bg-gray-300 dark:bg-gray-900 p-4">
//       <div className="md:hidden absolute top-58 left-4 z-50">
//         <button
//           onClick={() => setIsToolboxVisible(!isToolboxVisible)}
//           className="p-2 bg-gray-800 text-white rounded-md"
//         >
//           <Menu size={28} />
//         </button>
//       </div>

//       <div
//         className={`fixed md:relative md:w-20 w-full md:h-auto mt-6 top-50 left-1 flex md:flex-col justify-center md:justify-start transition-transform duration-300 ease-in-out ${
//           isToolboxVisible ? "translate-x-0" : "-translate-x-full"
//         } md:translate-x-0 md:flex md:flex-col md:items-center`}
//       >
//         <Toolbox onSelectTool={handleSelectTool} activeTool={selectedTool} />
//       </div>

//       <div className="flex flex-col items-center flex-1 w-full max-w-screen-xl px-4">
//         <Toolbar
//           onUndo={handleUndo}
//           onRedo={handleRedo}
//           onClear={handleClear}
//         />
//         <div className="relative w-full max-w-6xl max-h-[80vh] shadow-lg rounded-xl border bg-gray-100 dark:bg-gray-400 border-gray-300 dark:border-gray-700 overflow-hidden">
//           <Stage
//             ref={stageRef}
//             width={canvasWidth}
//             height={canvasHeight}
//             onMouseDown={handleMouseDown}
//             onMouseMove={handleMouseMove}
//             onMouseUp={handleMouseUp}
//           >
//             <Layer>
//               {lines.map((line, index) => (
//                 <Line
//                   key={index}
//                   points={line.points}
//                   stroke={line.stroke}
//                   strokeWidth={line.strokeWidth}
//                   tension={line.tool === "pen" ? 0.5 : 0.2}
//                   dash={line.tool === "pencil" ? [5, 5] : []}
//                   lineCap="round"
//                   lineJoin="round"
//                 />
//               ))}
//               {currentLine.length > 0 && (
//                 <Line
//                   key="current-line"
//                   points={currentLine}
//                   stroke="black"
//                   strokeWidth={2}
//                   tension={0.5}
//                   lineCap="round"
//                   lineJoin="round"
//                 />
//               )}
//               {shapes.map((shape, index) => (
//                 <Rect
//                   key={index}
//                   x={shape.x}
//                   y={shape.y}
//                   width={shape.width}
//                   height={shape.height}
//                   stroke="black"
//                   strokeWidth={2}
//                 />
//               ))}
//               {currentShape && (
//                 <Rect
//                   x={currentShape.x}
//                   y={currentShape.y}
//                   width={currentShape.width}
//                   height={currentShape.height}
//                   stroke="black"
//                   strokeWidth={2}
//                   dash={[10, 5]} //  Dotted line for preview
//                 />
//               )}
//               {texts.map((t) => (
//                 <Text
//                   key={t.id}
//                   id={t.id}
//                   text={
//                     t.text === "Type here..." &&
//                     isEditingText &&
//                     editTextProps?.id === t.id
//                       ? ""
//                       : t.text
//                   }
//                   x={t.x}
//                   y={t.y}
//                   fontSize={t.fontSize}
//                   fill="black"
//                   draggable
//                   onDblClick={() => handleEditText(t)}
//                   onDragEnd={(e) => handleTextDragEnd(e, t)}
//                 />
//               ))}
//               {currentText && (
//                 <Text
//                   text={currentText.text}
//                   x={currentText.x}
//                   y={currentText.y}
//                   fontSize={currentText.fontSize}
//                   fill="gray"
//                 />
//               )}
//             </Layer>
//           </Stage>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Canvas;
