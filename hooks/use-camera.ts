"use client";

import { useEffect, useRef } from "react";
import { useCameraStore } from "@/stores/camera-store";

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { stream, isActive, startCamera, stopCamera } = useCameraStore();

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return { videoRef, isActive, startCamera, stopCamera };
}
