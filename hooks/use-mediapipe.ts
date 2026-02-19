"use client";

import { useState, useCallback } from "react";
import type { HandLandmarker } from "@mediapipe/tasks-vision";

export function useMediapipe() {
  const [landmarker, setLandmarker] = useState<HandLandmarker | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialize = useCallback(async () => {
    if (landmarker || loading) return;
    setLoading(true);
    setError(null);

    try {
      const { initializeHandLandmarker } = await import("@/lib/ml/mediapipe");
      const instance = await initializeHandLandmarker();
      setLandmarker(instance);
    } catch (err) {
      setError("Failed to initialize hand tracking");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [landmarker, loading]);

  return { landmarker, loading, error, initialize };
}
