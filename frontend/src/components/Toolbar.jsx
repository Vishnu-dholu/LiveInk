import React from "react";

const Toolbar = ({ onUndo, onRedo, onClear }) => {
  return (
    <div className="absolute top-4 left-4 flex gap-4">
      <button onClick={onUndo}>Undo</button>
      <button onClick={onRedo}>Redo</button>
      <button onClick={onClear}>Clear</button>
    </div>
  );
};

export default Toolbar;
