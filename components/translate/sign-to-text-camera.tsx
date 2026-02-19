"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useCameraStore } from "@/stores/camera-store";
import { useGestureStore } from "@/stores/gesture-store";
import { useMediapipe } from "@/hooks/use-mediapipe";
import { useGestureRecognition } from "@/hooks/use-gesture-recognition";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw, Trash2, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function SignToTextCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { stream, isActive, startCamera, stopCamera, toggleFacingMode } =
    useCameraStore();
  const { isDetecting, currentPrediction, confidence, startDetection, stopDetection } =
    useGestureStore();
  const { landmarker, loading: mpLoading, initialize: initMP } = useMediapipe();

  useGestureRecognition(landmarker, videoRef, canvasRef);

  const [textBuffer, setTextBuffer] = useState("");
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const addTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Attach stream to video
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Init MediaPipe when camera active
  useEffect(() => {
    if (isActive && !landmarker && !mpLoading) {
      initMP();
    }
  }, [isActive, landmarker, mpLoading, initMP]);

  // Start detection when ready
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

  // Buffer prediction into text after holding steady for 1.5s
  useEffect(() => {
    if (addTimeoutRef.current) {
      clearTimeout(addTimeoutRef.current);
    }

    if (currentPrediction && confidence > 0.6 && currentPrediction !== lastAdded) {
      addTimeoutRef.current = setTimeout(() => {
        setTextBuffer((prev) => prev + currentPrediction);
        setLastAdded(currentPrediction);
      }, 1500);
    }

    return () => {
      if (addTimeoutRef.current) clearTimeout(addTimeoutRef.current);
    };
  }, [currentPrediction, confidence, lastAdded]);

  const addSpace = useCallback(() => {
    setTextBuffer((prev) => prev + " ");
    setLastAdded(null);
  }, []);

  const handleCopy = useCallback(async () => {
    if (!textBuffer) return;
    await navigator.clipboard.writeText(textBuffer);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }, [textBuffer]);

  return (
    <div className="space-y-4">
      {/* Camera feed */}
      <div className="relative overflow-hidden rounded-lg bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full scale-x-[-1]"
          style={{ maxHeight: "350px" }}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 size-full scale-x-[-1]"
        />

        {mpLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="flex flex-col items-center gap-2 text-white">
              <Loader2 className="size-8 animate-spin" />
              <span className="text-sm">Loading hand tracking...</span>
            </div>
          </div>
        )}

        {currentPrediction && (
          <div className="absolute bottom-4 left-4 rounded-lg bg-black/70 px-4 py-2 text-white">
            <div className="text-lg font-bold">{currentPrediction}</div>
            <div className="text-xs text-white/70">
              Confidence: {Math.round(confidence * 100)}%
            </div>
          </div>
        )}

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

      <div className="text-sm text-muted-foreground">
        {isDetecting
          ? "Show signs to the camera. Hold steady to add a letter."
          : "Camera initializing..."}
      </div>

      {/* Recognized text output */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium">Recognized Text</span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              disabled={!textBuffer}
              aria-label="Copy text"
            >
              {copied ? (
                <Check className="size-3.5" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setTextBuffer("");
                setLastAdded(null);
              }}
              disabled={!textBuffer}
              aria-label="Clear text"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
        <div
          className={cn(
            "min-h-[3rem] rounded-md border bg-background p-3 font-mono text-lg",
            !textBuffer && "text-muted-foreground"
          )}
        >
          {textBuffer || "Signs will appear here as text..."}
          <span className="animate-pulse">|</span>
        </div>
        <div className="mt-2 flex gap-2">
          <Button variant="outline" size="sm" onClick={addSpace}>
            Space
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setTextBuffer((prev) => prev.slice(0, -1))
            }
            disabled={!textBuffer}
          >
            Backspace
          </Button>
        </div>
      </div>
    </div>
  );
}
