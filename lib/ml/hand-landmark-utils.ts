import type { HandLandmark } from "@/types/ml";

export function normalizeLandmarks(landmarks: HandLandmark[]): number[] {
  if (landmarks.length === 0) return [];

  // Translate to wrist origin
  const wrist = landmarks[0];
  const translated = landmarks.map((l) => ({
    x: l.x - wrist.x,
    y: l.y - wrist.y,
    z: l.z - wrist.z,
  }));

  // Scale to unit bounding box
  let maxDist = 0;
  for (const l of translated) {
    const dist = Math.sqrt(l.x * l.x + l.y * l.y + l.z * l.z);
    if (dist > maxDist) maxDist = dist;
  }

  const scale = maxDist > 0 ? 1 / maxDist : 1;

  // Flatten to array
  const features: number[] = [];
  for (const l of translated) {
    features.push(l.x * scale, l.y * scale, l.z * scale);
  }

  return features;
}

export function drawHandLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarks: HandLandmark[],
  width: number,
  height: number,
  color: string = "#00ff00"
) {
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  // Draw points
  for (const landmark of landmarks) {
    const x = landmark.x * width;
    const y = landmark.y * height;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fill();
  }

  // Draw connections
  const connections = [
    [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
    [0, 5], [5, 6], [6, 7], [7, 8],       // Index
    [0, 9], [9, 10], [10, 11], [11, 12],  // Middle
    [0, 13], [13, 14], [14, 15], [15, 16], // Ring
    [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
    [5, 9], [9, 13], [13, 17],             // Palm
  ];

  for (const [start, end] of connections) {
    if (landmarks[start] && landmarks[end]) {
      ctx.beginPath();
      ctx.moveTo(landmarks[start].x * width, landmarks[start].y * height);
      ctx.lineTo(landmarks[end].x * width, landmarks[end].y * height);
      ctx.stroke();
    }
  }
}
