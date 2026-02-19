import type { HandLandmark, GesturePrediction } from "@/types/ml";
import { normalizeLandmarks } from "./hand-landmark-utils";

const CONFIDENCE_THRESHOLD = 0.7;
const SMOOTHING_FRAMES = 5;

let recentPredictions: string[] = [];

export function classifyGesture(
  landmarks: HandLandmark[],
  predictFn: (features: number[]) => Promise<{ label: string; confidence: number }>
): Promise<GesturePrediction | null> {
  const features = normalizeLandmarks(landmarks);
  if (features.length === 0) return Promise.resolve(null);

  return predictFn(features).then(({ label, confidence }) => {
    if (confidence < CONFIDENCE_THRESHOLD) {
      recentPredictions = [];
      return null;
    }

    recentPredictions.push(label);
    if (recentPredictions.length > SMOOTHING_FRAMES) {
      recentPredictions.shift();
    }

    // Require consistent prediction across frames
    const allSame = recentPredictions.every((p) => p === label);
    if (recentPredictions.length >= SMOOTHING_FRAMES && allSame) {
      return {
        label,
        confidence,
        timestamp: Date.now(),
      };
    }

    return null;
  });
}

export function resetClassifier() {
  recentPredictions = [];
}
