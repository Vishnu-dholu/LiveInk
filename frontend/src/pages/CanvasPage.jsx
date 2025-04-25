import React from "react";
import Canvas from "../components/canvas/Canvas";

const CanvasPage = () => {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-200 dark:bg-gray-900">
      <Canvas />
    </div>
  );
};

export default CanvasPage;
