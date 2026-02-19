"use client";

import { useEffect } from "react";
import { Camera, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCameraStore } from "@/stores/camera-store";

interface CameraPermissionGateProps {
  children: React.ReactNode;
}

export function CameraPermissionGate({ children }: CameraPermissionGateProps) {
  const { hasPermission, error, requestPermission, startCamera } =
    useCameraStore();

  useEffect(() => {
    if (hasPermission === null) {
      // Check if mediaDevices is available
      if (!navigator.mediaDevices?.getUserMedia) {
        useCameraStore.setState({
          hasPermission: false,
          error: "Camera API not supported in this browser",
        });
      }
    }
  }, [hasPermission]);

  if (hasPermission === true) {
    return <>{children}</>;
  }

  if (hasPermission === false) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="mb-4 size-12 text-destructive" />
          <h3 className="mb-2 text-lg font-semibold">Camera Access Required</h3>
          <p className="mb-4 max-w-md text-sm text-muted-foreground">
            {error ??
              "Camera permission was denied. Please enable camera access in your browser settings to use gesture recognition."}
          </p>
          <Button onClick={requestPermission}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <Camera className="mb-4 size-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold">Enable Camera</h3>
        <p className="mb-4 max-w-md text-sm text-muted-foreground">
          We need camera access to detect your hand gestures. Your camera feed
          stays on your device and is never uploaded.
        </p>
        <Button
          onClick={async () => {
            await requestPermission();
            await startCamera();
          }}
        >
          Enable Camera
        </Button>
      </CardContent>
    </Card>
  );
}
