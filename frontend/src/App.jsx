import React from "react";
import Canvas from "./components/Canvas";

const App = () => {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">
        🎨 Real-Time Drawing App
      </h1>
      <Canvas />
    </div>
  );
};

export default App;
