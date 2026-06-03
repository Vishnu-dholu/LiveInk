import {
  addLine,
  addText,
  clearCurrentShape,
  drawShape,
  beginErase,
  eraseAt,
  eraseShape,
  eraseText,
  setFillColor,
  setLiveLines,
  setLiveShapes,
  appendLiveLinePoints,
  removeLiveLine,
  updateLiveShape,
  removeLiveShape,
  syncState,
  updateCurrentLine,
  updateCurrentShape,
  updateShapeFill,
  updateShapeTransform,
  updateTextContent,
  updateTextFill,
  updateTextFontFamily,
  updateTextFontSize,
  updateTextFontStyle,
} from "@/store/drawingSlice";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { clearCanvas, redoAction, undoAction } from "../store/drawingSlice";
import { decode } from "@/proto/codec";

/**
 *  Custom hook to handle all incoming socket events
 *  and dispatch corresponding Redux actions to update the canvas state.
 *
 * This keeps the canvas in sync across all connected users in real-time.
 */
export const useSocketListeners = (socket) => {
  const dispatch = useDispatch();

  /**
   * Handle finalized line drawing from another user.
   * @param {Object} line - The complete line object to be added.
   */
  const handleDraw = (buffer) => {
    const finalLine = decode("DrawFinal", buffer);
    if (!finalLine) return;
    dispatch(addLine(finalLine));
    if (finalLine.socketId) {
      dispatch(removeLiveLine(finalLine.socketId));
    }
  };

  const handleLiveLine = (buffer) => {
    const liveLine = decode("DrawLive", buffer);
    if (!liveLine || !liveLine.socketId) return;
    dispatch(appendLiveLinePoints(liveLine));
  };

  const handleShape = (buffer) => {
    const finalShape = decode("ShapeFinal", buffer);
    if (!finalShape) return;
    dispatch(drawShape(finalShape));
    if (finalShape.socketId) {
      dispatch(removeLiveShape(finalShape.socketId));
    }
  };

  const handleLiveShape = (buffer) => {
    const liveShape = decode("ShapeLive", buffer);
    if (!liveShape || !liveShape.socketId) return;
    dispatch(updateLiveShape(liveShape));
  };

  /**
   * Handle initiation of text input from another user.
   * @param {Object} textObj - Initial text object with position and default value.
   */
  const handleTextStart = (textObj) => {
    dispatch(addText(textObj));
  };

  /**
   * Handle real-time text content updates from another user.
   * @param {Object} payload - Contains id and new text string
   */
  const handleTextUpdate = (updatedText) => {
    dispatch(updateTextContent(updatedText));
  };

  const handleUpdateFontStyle = ({ id, fontStyle }) => {
    dispatch(updateTextFontStyle({ id, fontStyle }));
  };

  const handleUpdateFontFamily = ({ id, fontFamily }) => {
    dispatch(updateTextFontFamily({ id, fontFamily }));
  };

  const handleUpdateFontSize = ({ id, fontSize }) => {
    dispatch(updateTextFontSize({ id, fontSize }));
  };

  /**
   * Handle erasing lines based on coordinates from another user.
   * @param {Object} coords - x and y coordinates of the eraser tool.
   */
  const handleErase = (buffer) => {
    const batch = decode("EraseBatch", buffer);
    if (!batch || !batch.points) return;
    
    dispatch(beginErase());
    for (const point of batch.points) {
      dispatch(eraseAt({ x: point.x, y: point.y, radius: batch.radius }));
      dispatch(eraseShape({ x: point.x, y: point.y, radius: batch.radius }));
      dispatch(eraseText({ x: point.x, y: point.y, radius: batch.radius }));
    }
  };

  /**
   * Handle shape transformation like drag/resize from other users.
   * @param {Object} param0 - Contains shape id and its updated transform data.
   */
  const handleShapeUpdate = ({ id, updatedShape }) => {
    dispatch(updateShapeTransform({ id, updatedShape }));
  };

  const handleShapeFill = ({ id, fill }) => {
    dispatch(updateShapeFill({ id, fill }));
  };

  const handleTextFill = ({ id, fill }) => {
    dispatch(updateTextFill({ id, fill }));
  };

  const handleSyncState = (stateData) => {
    dispatch(syncState(stateData));
  };

  /**
   * Register all socket event listeners on mount,
   * and clean them up on unmount or when socket changes.
   */
  useEffect(() => {
    if (!socket) return;

    // Register listeners
    socket.on("draw", handleDraw);
    socket.on("draw:live", handleLiveLine);
    socket.on("drawShape", handleShape);
    socket.on("shape:live", handleLiveShape);
    socket.on("erase", handleErase);
    socket.on("shape:update", handleShapeUpdate);

    socket.on("text:start", handleTextStart);
    socket.on("text:update", handleTextUpdate);

    socket.on("sync:state", handleSyncState);

    socket.on("shape:fill", handleShapeFill);
    socket.on("text:fill", handleTextFill);

    socket.on("text:updateFontStyle", handleUpdateFontStyle);
    socket.on("text:updateFontFamily", handleUpdateFontFamily);
    socket.on("text:updateFontSize", handleUpdateFontSize);

    // Cleanup listeners on unmount or re-init
    return () => {
      socket.off("draw", handleDraw);
      socket.off("draw:live", handleLiveLine);
      socket.off("drawShape", handleShape);
      socket.off("shape:live", handleLiveShape);
      socket.off("erase", handleErase);
      socket.off("shape:update", handleShapeUpdate);

      socket.off("text:start", handleTextStart);
      socket.off("text:update", handleTextUpdate);

      socket.off("sync:state", handleSyncState);

      socket.off("shape:fill", handleShapeFill);
      socket.off("text:fill", handleTextFill);

      socket.off("text:updateFontStyle", handleUpdateFontStyle);
      socket.off("text:updateFontFamily", handleUpdateFontFamily);
      socket.off("text:updateFontSize", handleUpdateFontSize);
    };
  }, [dispatch, socket]);
};
