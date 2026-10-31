import { configureStore } from "@reduxjs/toolkit";
import drawingReducer from "./drawingSlice";
import { socket } from "../lib/socket";
import { diffCanvas } from "../lib/canvasDiff";

// Actions that apply changes received from the server; they must never be echoed back
const REMOTE_ACTIONS = new Set(["drawing/applyRemoteOps", "drawing/syncState"]);

/**
 * After every local action that changed lines/shapes/texts, send only the delta
 * (what was added, updated or removed, by id) to the server.
 */
const canvasSyncMiddleware = (storeApi) => (next) => (action) => {
  if (typeof action?.type !== "string" || !action.type.startsWith("drawing/")) {
    return next(action);
  }

  const before = storeApi.getState().drawing;
  const result = next(action);
  const after = storeApi.getState().drawing;

  if (
    REMOTE_ACTIONS.has(action.type) ||
    (before.lines === after.lines &&
      before.shapes === after.shapes &&
      before.texts === after.texts)
  ) {
    return result;
  }

  const ops = diffCanvas(before, after);
  if (ops.length > 0 && socket.connected) {
    socket.emit("canvas:ops", ops);
  }
  return result;
};

export const store = configureStore({
  reducer: {
    drawing: drawingReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(canvasSyncMiddleware),
});
