import { Label } from "@/components/ui/label";
import {
  updateTextFontStyleAndEmit,
  updateTextFontFamilyAndEmit,
} from "@/store/drawingSlice";
import React from "react";
import { useDispatch, useSelector } from "react-redux";

const FontStyleSelector = () => {
  const dispatch = useDispatch();
  const selectedTextId = useSelector((state) => state.drawing.selectedTextId);
  const texts = useSelector((state) => state.drawing.texts);
  const selectedText = texts.find((t) => t.id === selectedTextId);

  if (!selectedText) return null;

  const handleFontChange = (e) => {
    dispatch(
      updateTextFontFamilyAndEmit({
        id: selectedTextId,
        fontFamily: e.target.value,
      })
    );
  };

  const handleWeightChange = (e) => {
    dispatch(
      updateTextFontStyleAndEmit({
        id: selectedTextId,
        fontStyle: e.target.value,
      })
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
        Font Family
      </Label>
      <select
        value={selectedText.fontFamily || "Arial"}
        onChange={handleFontChange}
        className="p-2 rounded border dark:bg-gray-700 dark:text-white"
      >
        <option value="Arial">Arial</option>
        <option value="Helvetica">Helvetica</option>
        <option value="Verdana">Verdana</option>
        <option value="Tahoma">Tahoma</option>
        <option value="Trebuchet MS">Trebuchet MS</option>
        <option value="Georgia">Georgia</option>
        <option value="Palatino Linotype">Palatino Linotype</option>
        <option value="Times New Roman">Times New Roman</option>
        <option value="Courier New">Courier New</option>
        <option value="Lucida Console">Lucida Console</option>
        <option value="Roboto">Roboto</option>
      </select>

      <Label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
        Font Style
      </Label>
      <select
        value={selectedText.fontStyle || "normal"}
        onChange={handleWeightChange}
        className="p-2 rounded border dark:bg-gray-700 dark:text-white"
      >
        <option value="normal">Normal</option>
        <option value="bold">Bold</option>
        <option value="italic">Italic</option>
        <option value="bold italic">Bold Italic</option>
      </select>
    </div>
  );
};

export default FontStyleSelector;
