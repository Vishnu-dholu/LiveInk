import { addLine, clearCurrentShape, commitCurrentText, drawShape, removeLineAt, setFillColor, setLiveLines, setLiveShapes, updateCurrentLine, updateCurrentShape, updateCurrentText, updateShapeFill, updateShapeTransform, updateTextContent, updateTextFill, updateTextFontFamily, updateTextFontSize, updateTextFontStyle } from "@/store/drawingSlice";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { clearCanvas, redoAction, undoAction } from "../store/drawingSlice";

/**
 *  Custom hook to handle all incoming socket events
 *  and dispatch corresponding Redux actions to update the canvas state.
 * 
 * This keeps the canvas in sync across all connected users in real-time. 
 */
export const useSocketListeners = (socket) => {
    const dispatch = useDispatch()

    /**
     * Handle finalized line drawing from another user.
     * @param {Object} line - The complete line object to be added.
     */
    const handleDraw = (finalLine) => {
        dispatch(addLine(finalLine))
        dispatch(setLiveLines([]))
    }

    /**
     * Handle live line drawing updates from another user.
     * @param {Array} updatedLine - The array of updated points during drawing
     */
    const handleLiveLine = (liveLine) => {
        dispatch(setLiveLines([liveLine]))
    }

    /**
     * Handle finalized shape drawing from another user.
     * @param {Object} shape - The shape object to be added to the canvas.
     */
    const handleShape = (finalShape) => {
        dispatch(drawShape(finalShape))
        dispatch(clearCurrentShape())
        dispatch(setLiveShapes([]))
    }

    /**
     * Handle live shape transformation while it's being resized or drawn.
     * @param {Object} updatedShape 
     */
    const handleLiveShape = (liveShape) => {
        dispatch(setLiveShapes([liveShape]))
    }

    /**
     * Handle initiation of text input from another user.
     * @param {Object} textObj - Initial text object with position and default value.
     */
    const handleTextStart = (textObj) => {
        dispatch(updateCurrentText(textObj))
    }

    /**
     * Handle real-time text content updates from another user.
     * @param {Object} payload - Contains id and new text string 
     */
    const handleTextUpdate = (updatedText) => {
        dispatch(updateTextContent(updatedText));
    };


    /**
     * Handle when a user finishes editing a text and commits it.
     * @param {Object} textObj - Finalized text object to be saved.
     */
    const handleTextCommit = (textObj) => {
        dispatch(updateCurrentText(textObj));   //  Set text as current text
        dispatch(commitCurrentText());          //  Commit it to global state
    }

    const handleUpdateFontStyle = ({ id, fontStyle }) => {
        dispatch(updateTextFontStyle({ id, fontStyle }))
    }

    const handleUpdateFontFamily = ({ id, fontFamily }) => {
        dispatch(updateTextFontFamily({ id, fontFamily }))
    }

    const handleUpdateFontSize = ({ id, fontSize }) => {
        dispatch(updateTextFontSize({ id, fontSize }))
    }

    /**
     * Handle erasing lines based on coordinates from another user.
     * @param {Object} coords - x and y coordinates of the eraser tool.
     */
    const handleErase = (coords) => {
        dispatch(removeLineAt(coords))
    }

    /**
     * Handle shape transformation like drag/resize from other users.
     * @param {Object} param0 - Contains shape id and its updated transform data.
     */
    const handleShapeUpdate = ({ id, updateShape }) => {
        dispatch(updateShapeTransform({ id, updatedShape: updateShape }));
    }

    const handleColorChange = (newColor) => {
        dispatch(setFillColor(newColor))
    }

    const handleShapeFill = ({ id, fill }) => {
        dispatch(updateShapeFill({ id, fill }))
    }

    const handleTextFill = ({ id, fill }) => {
        dispatch(updateTextFill({ id, fill }))
    }

    // --- Undo/Redo/Clear ---
    const handleRemoteUndo = () => {
        dispatch(undoAction());
        dispatch(updateCurrentLine([]));
        dispatch(updateCurrentShape([]));
    };

    const handleRemoteRedo = () => {
        dispatch(redoAction());
        dispatch(updateCurrentLine([]));
        dispatch(updateCurrentShape([]));
    };

    const handleRemoteClear = () => {
        dispatch(clearCanvas());
        dispatch(updateCurrentLine([]));
        dispatch(updateCurrentShape([]));
    };

    /**
     * Register all socket event listeners on mount,
     * and clean them up on unmount or when socket changes.
     */
    useEffect(() => {
        if (!socket) return;

        // Register listeners
        socket.on("draw", handleDraw)
        socket.on("draw:live", handleLiveLine)
        socket.on("drawShape", handleShape)
        socket.on("shape:live", handleLiveShape)
        socket.on("erase", handleErase)
        socket.on("shape:update", handleShapeUpdate)

        socket.on("text:start", handleTextStart)
        socket.on("text:update", handleTextUpdate)
        socket.on("text:commit", handleTextCommit)

        socket.on("undo", handleRemoteUndo);
        socket.on("redo", handleRemoteRedo);
        socket.on("clear", handleRemoteClear);

        socket.on("color:change", handleColorChange)
        socket.on("shape:fill", handleShapeFill)
        socket.on("text:fill", handleTextFill)

        socket.on("text:updateFontStyle", handleUpdateFontStyle)
        socket.on("text:updateFontFamily", handleUpdateFontFamily)
        socket.on("text:updateFontSize", handleUpdateFontSize)

        // Cleanup listeners on unmount or re-init
        return () => {
            socket.off("draw", handleDraw)
            socket.off("draw:live", handleLiveLine)
            socket.off("drawShape", handleShape)
            socket.off("shape:live", handleLiveShape)
            socket.off("erase", handleErase)
            socket.off("shape:update", handleShapeUpdate)

            socket.off("text:start", handleTextStart)
            socket.off("text:update", handleTextUpdate)
            socket.off("text:commit", handleTextCommit)

            socket.off("undo", handleRemoteUndo)
            socket.off("redo", handleRemoteRedo)
            socket.off("clear", handleRemoteClear)

            socket.off("color:change", handleColorChange)
            socket.off("shape:fill", handleShapeFill)
            socket.off("text:fill", handleTextFill)

            socket.off("text:updateFontStyle", handleUpdateFontStyle)
            socket.off("text:updateFontFamily", handleUpdateFontFamily)
            socket.off("text:updateFontSize", handleUpdateFontSize)
        }
    }, [dispatch, socket])
}