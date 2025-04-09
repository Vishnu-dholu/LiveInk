import { useEffect, useRef } from "react";
import useTextEditing from "./useTextEditing";

const TextEditor = ({ stageRef }) => {
  const textareaRef = useRef(null);
  const { currentText, isEditing, handleChange, handleBlur } = useTextEditing();

  useEffect(() => {
    if (isEditing && textareaRef.current && currentText) {
      const stage = stageRef.current.getStage();
      const transform = stage?.getAbsoluteTransform()?.copy();
      transform?.invert();

      const { x, y } = transform?.point({
        x: currentText.x,
        y: currentText.y,
      }) || { x: 0, y: 0 };

      const textArea = textareaRef.current;
      textArea.style.position = "absolute";
      textArea.style.top = `${y}px`;
      textArea.style.left = `${x}px`;
      textArea.style.fontSize = `${currentText.fontSize || 20}px`;
      textArea.style.fontFamily = currentText.fontFamily || "sans-serif";
      textArea.style.padding = "2px";
      textArea.style.border = "1px solid #ccc";
      textArea.style.background = "#fff";
      textArea.style.resize = "none";
      textArea.style.zIndex = 10;
      textArea.focus();
    }
  }, [isEditing, currentText, stageRef]);

  if (!isEditing || !currentText) return null;

  return (
    <textarea
      ref={textareaRef}
      value={currentText.text}
      onChange={(e) => handleChange(e.target.value)}
      onBlur={handleBlur}
      rows={2}
      className="absolute shadow-md rounded-md text-black"
    />
  );
};

export default TextEditor;
