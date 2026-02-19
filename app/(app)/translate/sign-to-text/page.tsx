"use client";

import dynamic from "next/dynamic";
import { PageHeader } from "@/components/shared/page-header";
import { CameraPermissionGate } from "@/components/practice/camera-permission-gate";

const SignToTextCamera = dynamic(
  () =>
    import("@/components/translate/sign-to-text-camera").then(
      (m) => m.SignToTextCamera
    ),
  { ssr: false }
);

export default function SignToTextPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Sign to Text"
        description="Show ISL signs to your camera and see them translated to text in real time."
      />

      <CameraPermissionGate>
        <SignToTextCamera />
      </CameraPermissionGate>
    </div>
  );
}
