import {
  appendLiveLinePoints,
  applyRemoteOps,
  updateLiveShape,
} from "@/store/drawingSlice";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { decode } from "@/proto/codec";

/**
 * Custom hook that registers the incoming socket events and dispatches
 * the matching Redux actions, keeping the canvas in sync across users.
 *
 * - "draw:live" / "shape:live": ephemeral previews of someone else's in-progress stroke
 * - "canvas:ops": persistent deltas (add / update / remove / clear by id)
 */
export const useSocketListeners = (socket) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!socket) return;

    const handleLiveLine = (buffer) => {
      const liveLine = decode("DrawLive", buffer);
      if (!liveLine || !liveLine.socketId) return;
      dispatch(appendLiveLinePoints(liveLine));
    };

    const handleLiveShape = (buffer) => {
      const liveShape = decode("ShapeLive", buffer);
      if (!liveShape || !liveShape.socketId) return;
      dispatch(updateLiveShape(liveShape));
    };

    const handleOps = (ops) => {
      if (Array.isArray(ops)) dispatch(applyRemoteOps(ops));
    };

    socket.on("draw:live", handleLiveLine);
    socket.on("shape:live", handleLiveShape);
    socket.on("canvas:ops", handleOps);

    return () => {
      socket.off("draw:live", handleLiveLine);
      socket.off("shape:live", handleLiveShape);
      socket.off("canvas:ops", handleOps);
    };
  }, [dispatch, socket]);
};
