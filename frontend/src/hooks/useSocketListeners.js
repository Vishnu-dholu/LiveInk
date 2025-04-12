import { addLine, commitCurrentText, drawShape, removeLineAt, updateCurrentLine, updateCurrentShape, updateCurrentText, updateShapeTransform, updateTextContent } from "@/store/drawingSlice";
import { useEffect } from "react";
import { useDispatch } from "react-redux";

export const useSocketListeners = (socket) => {
    const dispatch = useDispatch()

    const handleDraw = (line) => {
        dispatch(addLine(line))
    }

    const handleLiveLine = (updatedLine) => {
        dispatch(updateCurrentLine(updatedLine))
    }

    const handleShape = (shape) => {
        dispatch(drawShape(shape))
    }

    const handleLiveShape = (updatedShape) => {
        dispatch(updateCurrentShape(updatedShape))
    }

    const handleTextStart = (textObj) => {
        dispatch(updateCurrentText(textObj))
    }

    const handleTextUpdate = ({ id, text }) => {
        dispatch(updateTextContent({ id, text }))
    }

    const handleTextCommit = (textObj) => {
        dispatch(updateCurrentText(textObj));
        dispatch(commitCurrentText());
    }

    const handleErase = (coords) => {
        dispatch(removeLineAt(coords))
    }

    const handleShapeUpdate = ({ id, updatedShape }) => {
        dispatch(updateShapeTransform({ id, updatedShape }));
    };

    useEffect(() => {
        if (!socket) return;

        socket.on("draw", handleDraw)
        socket.on("draw:live", handleLiveLine)
        socket.on("drawShape", handleShape)
        socket.on("shape:live", handleLiveShape)
        socket.on("text:start", handleTextStart)
        socket.on("text:update", handleTextUpdate)
        socket.on("text:commit", handleTextCommit)
        socket.on("erase", handleErase)
        socket.on("shape:update", handleShapeUpdate)

        return () => {
            socket.off("draw", handleDraw)
            socket.off("draw:live", handleLiveLine)
            socket.off("drawShape", handleShape)
            socket.off("shape:live", handleLiveShape)
            socket.off("text:start", handleTextStart)
            socket.off("text:update", handleTextUpdate)
            socket.off("text:commit", handleTextCommit)
            socket.off("erase", handleErase)
            socket.off("shape:update", handleShapeUpdate)

        }
    }, [socket, dispatch])
}