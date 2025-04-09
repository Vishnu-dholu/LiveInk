import { Text } from "react-konva";
import { useSelector } from "react-redux";

const TextRenderer = ({ isEditingText, editTextProps, onEdit }) => {
  const texts = useSelector((state) => state.drawing.texts);
  const currentText = useSelector((state) => state.drawing.currentText);

  const handleTextDragEnd = (e, textObj) => {
    const { x, y } = e.target.position();
    onEdit({
      ...textObj,
      x,
      y,
      isDrag: true,
    });
  };
  return (
    <>
      {texts.map((t) => (
        <Text
          key={t.id}
          id={t.id}
          text={
            t.text === "Type here..." &&
            isEditingText &&
            editTextProps?.id === t.id
              ? ""
              : t.text
          }
          x={t.x}
          y={t.y}
          fontSize={t.fontSize}
          fill="black"
          draggable
          onDblClick={() => onEdit(t)}
          onDragEnd={(e) => handleTextDragEnd(e, t)}
        />
      ))}
      {currentText && (
        <Text
          text={currentText.text}
          x={currentText.x}
          y={currentText.y}
          fontSize={currentText.fontSize}
          fill="gray"
        />
      )}
    </>
  );
};

export default TextRenderer;
