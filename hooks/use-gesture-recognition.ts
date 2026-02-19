"use client";

import { useRef, useCallback, useEffect } from "react";
import { useGestureStore } from "@/stores/gesture-store";
import type { HandLandmarker } from "@mediapipe/tasks-vision";
import type { HandLandmark } from "@/types/ml";

export function useGestureRecognition(
  landmarker: HandLandmarker | null,
  videoRef: React.RefObject<HTMLVideoElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>
) {
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const { isDetecting, setPrediction, clearPrediction, setModelLoaded } =
    useGestureStore();

  const drawLandmarks = useCallback(
    (landmarks: HandLandmark[], width: number, height: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = width;
      canvas.height = height;
      ctx.clearRect(0, 0, width, height);

      // Import and draw
      import("@/lib/ml/hand-landmark-utils").then(({ drawHandLandmarks }) => {
        drawHandLandmarks(ctx, landmarks, width, height, "#00ff00");
      });
    },
    [canvasRef]
  );

  const detect = useCallback(async () => {
    if (!landmarker || !videoRef.current || !isDetecting) return;

    const video = videoRef.current;
    if (video.readyState < 2) {
      animationRef.current = requestAnimationFrame(detect);
      return;
    }

    const now = performance.now();
    // Throttle to ~15fps
    if (now - lastTimeRef.current < 66) {
      animationRef.current = requestAnimationFrame(detect);
      return;
    }
    lastTimeRef.current = now;

    try {
      const results = landmarker.detectForVideo(video, now);

      if (results.landmarks && results.landmarks.length > 0) {
        const handLandmarks = results.landmarks[0] as HandLandmark[];
        drawLandmarks(handLandmarks, video.videoWidth, video.videoHeight);

        // Try TF.js classification
        try {
          const { normalizeLandmarks } = await import(
            "@/lib/ml/hand-landmark-utils"
          );
          const features = normalizeLandmarks(handLandmarks);

          if (features.length > 0) {
            const { loadGestureModel, predict } = await import(
              "@/lib/ml/tensorflow"
            );
            const model = await loadGestureModel();
            const result = await predict(model, features);

            if (result.confidence > 0.7) {
              setPrediction(result.label, result.confidence);
            }
          }
        } catch {
          // TF model not available — use ISL heuristic classifier
          const result = await getISLGestureLabel(handLandmarks);
          if (result) {
            setPrediction(result.label, result.confidence);
          }
        }
      } else {
        clearPrediction();
        // Clear canvas
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    } catch {
      // Ignore detection errors
    }

    animationRef.current = requestAnimationFrame(detect);
  }, [
    landmarker,
    videoRef,
    canvasRef,
    isDetecting,
    setPrediction,
    clearPrediction,
    drawLandmarks,
  ]);

  useEffect(() => {
    if (isDetecting && landmarker) {
      animationRef.current = requestAnimationFrame(detect);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isDetecting, landmarker, detect]);

  return { detect };
}

// ISL heuristic classifier — used when TF.js model is unavailable
async function getISLGestureLabel(
  landmarks: HandLandmark[]
): Promise<{ label: string; confidence: number } | null> {
  try {
    const { classifyISLSign } = await import(
      "@/lib/ml/isl-heuristic-classifier"
    );
    return classifyISLSign(landmarks);
  } catch {
    return null;
  }
}
