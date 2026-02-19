"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { PageHeader } from "@/components/shared/page-header";
import { CameraPermissionGate } from "@/components/practice/camera-permission-gate";
import { PracticePrompt } from "@/components/practice/practice-prompt";
import { PracticeFeedback } from "@/components/practice/practice-feedback";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGestureStore } from "@/stores/gesture-store";
import { SkipForward, RotateCcw } from "lucide-react";

// Dynamic import to avoid SSR issues with MediaPipe/TF.js
const GestureDetector = dynamic(
  () =>
    import("@/components/practice/gesture-detector").then(
      (m) => m.GestureDetector
    ),
  { ssr: false }
);

const ISL_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function GesturePracticePage() {
  const {
    currentPrediction,
    confidence,
    targetSign,
    isCorrect,
    consecutiveCorrect,
    totalAttempts,
    setTargetSign,
    checkAnswer,
    resetSession,
  } = useGestureStore();

  const [signIndex, setSignIndex] = useState(0);

  // Set initial target
  useEffect(() => {
    setTargetSign(ISL_ALPHABET[0]);
    return () => resetSession();
  }, []);

  // Check answer when prediction changes
  useEffect(() => {
    if (currentPrediction && targetSign) {
      checkAnswer();
    }
  }, [currentPrediction, targetSign, checkAnswer]);

  // Auto-advance on correct
  useEffect(() => {
    if (isCorrect) {
      const timer = setTimeout(() => {
        nextSign();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isCorrect]);

  const nextSign = useCallback(() => {
    const next = (signIndex + 1) % ISL_ALPHABET.length;
    setSignIndex(next);
    setTargetSign(ISL_ALPHABET[next]);
  }, [signIndex, setTargetSign]);

  const accuracy =
    totalAttempts > 0
      ? Math.round((consecutiveCorrect / totalAttempts) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gesture Practice"
        description="Practice ISL signs using your camera. Show the sign displayed below."
      />

      <CameraPermissionGate>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <GestureDetector />

            <PracticeFeedback
              isCorrect={isCorrect}
              prediction={currentPrediction}
              target={targetSign}
            />
          </div>

          <div className="space-y-4">
            <PracticePrompt
              signName={targetSign ?? "A"}
              signImageUrl={`/signs/alphabet/${(targetSign ?? "a").toLowerCase()}.svg`}
              instructions={`Form the ISL sign for "${targetSign}". Hold your hand steady in front of the camera.`}
            />

            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Score: <strong>{consecutiveCorrect}</strong> correct
                  </span>
                  <span className="text-muted-foreground">
                    Attempts: <strong>{totalAttempts}</strong>
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={nextSign}
              >
                <SkipForward className="mr-2 size-4" />
                Skip
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setSignIndex(0);
                  setTargetSign(ISL_ALPHABET[0]);
                  resetSession();
                }}
              >
                <RotateCcw className="mr-2 size-4" />
                Reset
              </Button>
            </div>
          </div>
        </div>
      </CameraPermissionGate>
    </div>
  );
}
