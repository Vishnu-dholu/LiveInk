import React from "react";

const Toolbar = ({ onUndo, onRedo, onClear }) => {
  return (
    <div className="absolute top-4 left-4 flex gap-4">
      {/* Undo Button */}
      <button
        onClick={onUndo}
        className="px-4 py-2 bg-blue-500 text-white rounded-md shadow-md hover:bg-blue-600 transition"
      >
        Undo
      </button>

      {/* Redo Button */}
      <button
        onClick={onRedo}
        className="px-4 py-2 bg-green-500 text-white rounded-md shadow-md hover:bg-green-600 transition"
      >
        Redo
      </button>

      {/* Clear Button */}
      <button
        onClick={onClear}
        className="px-4 py-2 bg-red-500 text-white rounded-md shadow-md hover:bg-red-600 transition"
      >
        Clear
      </button>
    </div>
  );
};

export default Toolbar;
