// src/hooks/useTextDeselect.js
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { deselectText } from "@/store/drawingSlice";

export const useTextDeselect = (stageRef) => {
    const dispatch = useDispatch();

    // Deselect on canvas click
    useEffect(() => {
        const handleStageClick = (e) => {
            if (e.target === e.target.getStage()) {
                dispatch(deselectText());
            }
        };

        const stage = stageRef?.current;
        if (stage) {
            stage.on("click", handleStageClick);
        }

        return () => {
            if (stage) {
                stage.off("click", handleStageClick);
            }
        };
    }, [dispatch, stageRef]);

    // Deselect on Escape key
    useEffect(() => {
        const handleEscKey = (e) => {
            if (e.key === "Escape") {
                dispatch(deselectText());
            }
        };

        window.addEventListener("keydown", handleEscKey);
        return () => window.removeEventListener("keydown", handleEscKey);
    }, [dispatch]);
};
