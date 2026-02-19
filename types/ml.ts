export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface HandDetectionResult {
  landmarks: HandLandmark[][];
  worldLandmarks: HandLandmark[][];
  handedness: { categoryName: string; score: number }[][];
}

export interface GesturePrediction {
  label: string;
  confidence: number;
  timestamp: number;
}

export interface ModelConfig {
  modelPath: string;
  labels: string[];
  inputShape: number[];
  confidenceThreshold: number;
  smoothingFrames: number;
}
