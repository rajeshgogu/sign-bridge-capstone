"use client";

import { useRef, useCallback, useEffect } from "react";
import { usePhraseStore } from "@/stores/phrase-store";
import type { HandLandmarker } from "@mediapipe/tasks-vision";
import type { HandLandmark } from "@/types/ml";
import { drawHandLandmarks } from "@/lib/ml/hand-landmark-utils";

export function usePhraseRecognition(
  landmarker: HandLandmarker | null,
  videoRef: React.RefObject<HTMLVideoElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>
) {
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const { isDetecting, targetPhrase, setPrediction, clearPrediction, setModelLoaded } =
    usePhraseStore();

  const drawAllHands = useCallback(
    (multiLandmarks: HandLandmark[][], width: number, height: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Only resize/clear once per frame
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      ctx.clearRect(0, 0, width, height);

      if (multiLandmarks.length === 0) return;

      multiLandmarks.forEach((landmarks, idx) => {
        const color = idx === 0 ? "#00e1ff" : "#ffdd00"; 
        drawHandLandmarks(ctx, landmarks, width, height, color);
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
    // Throttle to ~30fps
    if (now - lastTimeRef.current < 33) {
      animationRef.current = requestAnimationFrame(detect);
      return;
    }
    lastTimeRef.current = now;

    try {
      const results = landmarker.detectForVideo(video, now);

      if (results.landmarks && results.landmarks.length > 0) {
        // Draw all detected hands at once
        drawAllHands(results.landmarks, video.videoWidth, video.videoHeight);

        // Try heuristic classifier passing ALL hands and the target phrase ID
        const result = await getISLPhraseLabel(results.landmarks, targetPhrase);
        if (result) {
          setPrediction(result.label, result.confidence);
        } else {
          clearPrediction();
        }
      } else {
        // Clear canvas if no hands
        drawAllHands([], 0, 0);
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
    targetPhrase,
    setPrediction,
    clearPrediction,
    drawAllHands,
  ]);

  useEffect(() => {
    // Global suppression for MediaPipe's informational "errors" that trigger Next.js overlay
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      const msg = args[0]?.toString() || "";
      if (
        msg.includes("Created TensorFlow Lite XNNPACK delegate") ||
        msg.startsWith("INFO:") ||
        msg.includes("Service \"kGpuService\"") // Handle any remaining GPU warnings
      ) {
        return;
      }
      originalConsoleError(...args);
    };

    if (isDetecting && landmarker) {
      animationRef.current = requestAnimationFrame(detect);
    }

    return () => {
      console.error = originalConsoleError;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isDetecting, landmarker, detect]);

  return { detect };
}

// ISL heuristic phrase classifier
async function getISLPhraseLabel(
  landmarks: HandLandmark[][],
  targetPhraseId: string | null
): Promise<{ label: string; confidence: number } | null> {
  try {
    const { classifyISLPhrase } = await import(
      "@/lib/ml/isl-phrase-classifier"
    );
    return classifyISLPhrase(landmarks, targetPhraseId ?? undefined);
  } catch {
    return null;
  }
}
