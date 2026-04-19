"use client";

import { useRef, useEffect } from "react";
import { useCameraStore } from "@/stores/camera-store";
import { usePhraseStore } from "@/stores/phrase-store";
import { useMediapipe } from "@/hooks/use-mediapipe";
import { usePhraseRecognition } from "@/hooks/use-phrase-recognition";
import { Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PhraseDetector() {
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
  } = usePhraseStore();
  const { landmarker, loading: mpLoading, initialize: initMP } = useMediapipe();

  usePhraseRecognition(landmarker, videoRef, canvasRef);

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
      <div className="relative overflow-hidden rounded-lg bg-black shadow-lg ring-1 ring-white/10" style={{ height: "400px" }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={cn(
            "h-full w-full object-cover",
            "scale-x-[-1]" // Mirror for user-facing camera
          )}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full scale-x-[-1]"
        />

        {/* Loading overlay */}
        {mpLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2 text-white">
              <Loader2 className="size-8 animate-spin" />
              <span className="text-sm font-medium tracking-wide">Loading phrase tracking...</span>
            </div>
          </div>
        )}

        {/* Prediction overlay */}
        {currentPrediction && (
          <div className="absolute bottom-6 left-6 right-6 rounded-2xl bg-background/80 px-6 py-4 text-foreground shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] backdrop-blur-xl transition-all border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-black tracking-tight capitalize text-primary">
                {currentPrediction.replace('_', ' ')}
              </div>
              <div className="text-sm font-bold bg-primary/20 text-primary px-2 py-1 rounded-full">
                {Math.round(confidence * 100)}% Match
              </div>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full transition-all duration-300",
                  confidence > 0.9 ? "bg-green-500" : "bg-primary"
                )}
                style={{ width: `${confidence * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 uppercase font-bold tracking-widest text-center">
              Hold position for validation
            </p>
          </div>
        )}

        {/* Camera toggle button */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute right-4 top-4 shadow-md bg-black/40 hover:bg-black/80 text-white border-0"
          onClick={toggleFacingMode}
          aria-label="Switch camera"
        >
          <RotateCcw className="size-4" />
        </Button>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
        <span>
          {isDetecting ? "Detecting phrases..." : "Camera initializing..."}
        </span>
        {currentPrediction && (
          <span className="font-medium text-primary capitalize bg-primary/10 px-2 py-0.5 rounded-md">
            Detected: {currentPrediction.replace('_', ' ')}
          </span>
        )}
      </div>
    </div>
  );
}
