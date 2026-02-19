"use client";

import { useRef, useEffect } from "react";
import { useCameraStore } from "@/stores/camera-store";
import { useGestureStore } from "@/stores/gesture-store";
import { useMediapipe } from "@/hooks/use-mediapipe";
import { useGestureRecognition } from "@/hooks/use-gesture-recognition";
import { Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function GestureDetector() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { stream, isActive, startCamera, stopCamera, toggleFacingMode } =
    useCameraStore();
  const {
    isDetecting,
    currentPrediction,
    confidence,
    startDetection,
    stopDetection,
  } = useGestureStore();
  const { landmarker, loading: mpLoading, initialize: initMP } = useMediapipe();

  useGestureRecognition(landmarker, videoRef, canvasRef);

  // Attach stream to video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Initialize MediaPipe and start detection when camera is active
  useEffect(() => {
    if (isActive && !landmarker && !mpLoading) {
      initMP();
    }
  }, [isActive, landmarker, mpLoading, initMP]);

  useEffect(() => {
    if (isActive && landmarker) {
      startDetection();
    }
    return () => stopDetection();
  }, [isActive, landmarker, startDetection, stopDetection]);

  // Start camera on mount
  useEffect(() => {
    if (!isActive) {
      startCamera();
    }
    return () => {
      stopCamera();
      stopDetection();
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-lg bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={cn(
            "w-full",
            "scale-x-[-1]" // Mirror for user-facing camera
          )}
          style={{ maxHeight: "400px" }}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 size-full scale-x-[-1]"
        />

        {/* Loading overlay */}
        {mpLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="flex flex-col items-center gap-2 text-white">
              <Loader2 className="size-8 animate-spin" />
              <span className="text-sm">Loading hand tracking...</span>
            </div>
          </div>
        )}

        {/* Prediction overlay */}
        {currentPrediction && (
          <div className="absolute bottom-4 left-4 rounded-lg bg-black/70 px-4 py-2 text-white">
            <div className="text-lg font-bold">{currentPrediction}</div>
            <div className="text-xs text-white/70">
              Confidence: {Math.round(confidence * 100)}%
            </div>
          </div>
        )}

        {/* Camera toggle button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 bg-black/50 text-white hover:bg-black/70"
          onClick={toggleFacingMode}
          aria-label="Switch camera"
        >
          <RotateCcw className="size-4" />
        </Button>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {isDetecting ? "Detecting gestures..." : "Camera initializing..."}
        </span>
        {currentPrediction && (
          <span className="font-medium text-primary">
            Detected: {currentPrediction}
          </span>
        )}
      </div>
    </div>
  );
}
