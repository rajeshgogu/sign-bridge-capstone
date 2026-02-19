import type { HandLandmark } from "@/types/ml";

/**
 * Comprehensive ISL (Indian Sign Language) heuristic classifier.
 * Uses MediaPipe hand landmarks (21 points) to classify ISL alphabet (A-Z)
 * and numbers (0-9) using joint angles, distances, and geometric features.
 *
 * Landmark indices:
 *   0: Wrist
 *   1-4: Thumb  (CMC, MCP, IP, TIP)
 *   5-8: Index  (MCP, PIP, DIP, TIP)
 *   9-12: Middle (MCP, PIP, DIP, TIP)
 *   13-16: Ring  (MCP, PIP, DIP, TIP)
 *   17-20: Pinky (MCP, PIP, DIP, TIP)
 */

// ── Geometry Helpers ───────────────────────────────────────────────

function dist(a: HandLandmark, b: HandLandmark): number {
  return Math.sqrt(
    (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2
  );
}

function dist2D(a: HandLandmark, b: HandLandmark): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/** Angle at point B between vectors BA and BC (degrees) */
function angleDeg(
  a: HandLandmark,
  b: HandLandmark,
  c: HandLandmark
): number {
  const ba = { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  const bc = { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z };
  const dot = ba.x * bc.x + ba.y * bc.y + ba.z * bc.z;
  const magBA = Math.sqrt(ba.x ** 2 + ba.y ** 2 + ba.z ** 2);
  const magBC = Math.sqrt(bc.x ** 2 + bc.y ** 2 + bc.z ** 2);
  if (magBA < 1e-6 || magBC < 1e-6) return 180;
  const cos = Math.max(-1, Math.min(1, dot / (magBA * magBC)));
  return Math.acos(cos) * (180 / Math.PI);
}

// ── Feature Extraction ────────────────────────────────────────────

interface FingerFeatures {
  /** PIP joint angle (180=straight, <90=fully curled) */
  pipAngle: number;
  /** DIP joint angle */
  dipAngle: number;
  /** Whether finger tip is further from wrist than its MCP */
  tipBeyondMCP: boolean;
  /** Distance from tip to wrist, normalized by palm size */
  tipWristDist: number;
  /** 0=fully extended, 1=fully curled */
  curl: number;
}

interface HandFeatures {
  thumb: FingerFeatures & {
    /** Thumb tip distance to index MCP (abduction) */
    abduction: number;
    /** Whether thumb crosses in front of palm (tip near ring/middle MCP) */
    crossesPalm: boolean;
  };
  index: FingerFeatures;
  middle: FingerFeatures;
  ring: FingerFeatures;
  pinky: FingerFeatures;

  // Inter-finger distances (normalized)
  thumbIndexTipDist: number;
  thumbMiddleTipDist: number;
  indexMiddleTipDist: number;
  middleRingTipDist: number;
  ringPinkyTipDist: number;
  indexMiddleSpread: boolean;
  middleRingSpread: boolean;

  // Palm reference
  palmSize: number;
}

function fingerFeatures(
  lm: HandLandmark[],
  mcpIdx: number,
  pipIdx: number,
  dipIdx: number,
  tipIdx: number,
  palmSize: number
): FingerFeatures {
  const pipAngle = angleDeg(lm[mcpIdx], lm[pipIdx], lm[dipIdx]);
  const dipAngle = angleDeg(lm[pipIdx], lm[dipIdx], lm[tipIdx]);
  const tipWristDist = dist(lm[tipIdx], lm[0]) / palmSize;
  const mcpWristDist = dist(lm[mcpIdx], lm[0]) / palmSize;
  const tipBeyondMCP = tipWristDist > mcpWristDist * 0.85;

  // Curl: 0 = extended (angles near 180), 1 = fully curled (angles near 0)
  const avgAngle = (pipAngle + dipAngle) / 2;
  const curl = Math.max(0, Math.min(1, 1 - avgAngle / 180));

  return { pipAngle, dipAngle, tipBeyondMCP, tipWristDist, curl };
}

function thumbFeatures(
  lm: HandLandmark[],
  palmSize: number
): HandFeatures["thumb"] {
  const pipAngle = angleDeg(lm[1], lm[2], lm[3]);
  const dipAngle = angleDeg(lm[2], lm[3], lm[4]);
  const tipWristDist = dist(lm[4], lm[0]) / palmSize;
  const mcpWristDist = dist(lm[2], lm[0]) / palmSize;
  const tipBeyondMCP = tipWristDist > mcpWristDist * 0.85;
  const avgAngle = (pipAngle + dipAngle) / 2;
  const curl = Math.max(0, Math.min(1, 1 - avgAngle / 180));

  const abduction = dist(lm[4], lm[5]) / palmSize;

  // Thumb crosses palm if tip is near middle/ring MCP area
  const distToMiddleMCP = dist(lm[4], lm[9]) / palmSize;
  const distToRingMCP = dist(lm[4], lm[13]) / palmSize;
  const crossesPalm = distToMiddleMCP < 0.6 || distToRingMCP < 0.6;

  return {
    pipAngle,
    dipAngle,
    tipBeyondMCP,
    tipWristDist,
    curl,
    abduction,
    crossesPalm,
  };
}

function extractFeatures(lm: HandLandmark[]): HandFeatures {
  // Palm size = distance from wrist to middle MCP
  const palmSize = dist(lm[0], lm[9]);
  if (palmSize < 1e-6) {
    // Degenerate hand, return defaults
    const defaultFinger: FingerFeatures = {
      pipAngle: 180,
      dipAngle: 180,
      tipBeyondMCP: false,
      tipWristDist: 0,
      curl: 0.5,
    };
    return {
      thumb: {
        ...defaultFinger,
        abduction: 0,
        crossesPalm: false,
      },
      index: defaultFinger,
      middle: defaultFinger,
      ring: defaultFinger,
      pinky: defaultFinger,
      thumbIndexTipDist: 0,
      thumbMiddleTipDist: 0,
      indexMiddleTipDist: 0,
      middleRingTipDist: 0,
      ringPinkyTipDist: 0,
      indexMiddleSpread: false,
      middleRingSpread: false,
      palmSize,
    };
  }

  const thumb = thumbFeatures(lm, palmSize);
  const index = fingerFeatures(lm, 5, 6, 7, 8, palmSize);
  const middle = fingerFeatures(lm, 9, 10, 11, 12, palmSize);
  const ring = fingerFeatures(lm, 13, 14, 15, 16, palmSize);
  const pinky = fingerFeatures(lm, 17, 18, 19, 20, palmSize);

  const thumbIndexTipDist = dist(lm[4], lm[8]) / palmSize;
  const thumbMiddleTipDist = dist(lm[4], lm[12]) / palmSize;
  const indexMiddleTipDist = dist(lm[8], lm[12]) / palmSize;
  const middleRingTipDist = dist(lm[12], lm[16]) / palmSize;
  const ringPinkyTipDist = dist(lm[16], lm[20]) / palmSize;

  // Spread = tips are far apart relative to palm
  const indexMiddleSpread = indexMiddleTipDist > 0.35;
  const middleRingSpread = middleRingTipDist > 0.35;

  return {
    thumb,
    index,
    middle,
    ring,
    pinky,
    thumbIndexTipDist,
    thumbMiddleTipDist,
    indexMiddleTipDist,
    middleRingTipDist,
    ringPinkyTipDist,
    indexMiddleSpread,
    middleRingSpread,
    palmSize,
  };
}

// ── Classification Helpers ─────────────────────────────────────────

function isExtended(f: FingerFeatures): boolean {
  return f.curl < 0.22 && f.pipAngle > 150;
}

function isCurled(f: FingerFeatures): boolean {
  return f.curl > 0.35 || f.pipAngle < 130;
}

function isBent(f: FingerFeatures): boolean {
  return f.pipAngle >= 110 && f.pipAngle <= 155;
}

function isThumbOut(t: HandFeatures["thumb"]): boolean {
  return t.abduction > 0.5 && t.curl < 0.3;
}

function isThumbTucked(t: HandFeatures["thumb"]): boolean {
  return t.abduction < 0.55 && !t.crossesPalm;
}

function isThumbAcross(t: HandFeatures["thumb"]): boolean {
  return t.crossesPalm;
}

// ── ISL Sign Rules ─────────────────────────────────────────────────

interface SignRule {
  label: string;
  match: (f: HandFeatures) => number; // Returns score 0-1
}

const ISL_SIGNS: SignRule[] = [
  // ── Alphabet ─────────────────────────────────────────────────────

  {
    label: "A",
    match: (f) => {
      let score = 0;
      const total = 5;
      if (isThumbOut(f.thumb)) score++;
      if (isCurled(f.index)) score++;
      if (isCurled(f.middle)) score++;
      if (isCurled(f.ring)) score++;
      if (isCurled(f.pinky)) score++;
      return score / total;
    },
  },
  {
    label: "B",
    match: (f) => {
      let score = 0;
      const total = 6;
      if (isThumbTucked(f.thumb) || f.thumb.curl > 0.25) score++;
      if (isExtended(f.index)) score++;
      if (isExtended(f.middle)) score++;
      if (isExtended(f.ring)) score++;
      if (isExtended(f.pinky)) score++;
      // Fingers together (not spread)
      if (!f.indexMiddleSpread) score++;
      return score / total;
    },
  },
  {
    label: "C",
    match: (f) => {
      let score = 0;
      const total = 5;
      if (isBent(f.index)) score++;
      if (isBent(f.middle)) score++;
      if (isBent(f.ring)) score++;
      if (isBent(f.pinky)) score++;
      if (isThumbOut(f.thumb) || f.thumb.curl < 0.35) score++;
      return score / total;
    },
  },
  {
    label: "D",
    match: (f) => {
      let score = 0;
      const total = 5;
      if (isExtended(f.index)) score++;
      if (isCurled(f.middle)) score++;
      if (isCurled(f.ring)) score++;
      if (isCurled(f.pinky)) score++;
      // Thumb touches or near middle finger area
      if (f.thumbMiddleTipDist < 0.5 || isThumbAcross(f.thumb)) score++;
      return score / total;
    },
  },
  {
    label: "E",
    match: (f) => {
      let score = 0;
      const total = 5;
      if (f.thumb.curl > 0.25 || isThumbTucked(f.thumb)) score++;
      if (isCurled(f.index) || isBent(f.index)) score++;
      if (isCurled(f.middle) || isBent(f.middle)) score++;
      if (isCurled(f.ring) || isBent(f.ring)) score++;
      if (isCurled(f.pinky) || isBent(f.pinky)) score++;
      return score / total;
    },
  },
  {
    label: "F",
    match: (f) => {
      let score = 0;
      const total = 5;
      // Thumb and index form circle (close together)
      if (f.thumbIndexTipDist < 0.35) score++;
      if (isBent(f.index) || isCurled(f.index)) score++;
      if (isExtended(f.middle)) score++;
      if (isExtended(f.ring)) score++;
      if (isExtended(f.pinky)) score++;
      return score / total;
    },
  },
  {
    label: "G",
    match: (f) => {
      let score = 0;
      const total = 5;
      if (isExtended(f.index)) score++;
      if (isCurled(f.middle)) score++;
      if (isCurled(f.ring)) score++;
      if (isCurled(f.pinky)) score++;
      if (isThumbOut(f.thumb) || f.thumb.curl < 0.3) score++;
      return score / total;
    },
  },
  {
    label: "H",
    match: (f) => {
      let score = 0;
      const total = 5;
      if (isExtended(f.index)) score++;
      if (isExtended(f.middle)) score++;
      if (isCurled(f.ring)) score++;
      if (isCurled(f.pinky)) score++;
      if (isThumbTucked(f.thumb) || f.thumb.curl > 0.2) score++;
      return score / total;
    },
  },
  {
    label: "I",
    match: (f) => {
      let score = 0;
      const total = 5;
      if (isThumbTucked(f.thumb) || f.thumb.curl > 0.25) score++;
      if (isCurled(f.index)) score++;
      if (isCurled(f.middle)) score++;
      if (isCurled(f.ring)) score++;
      if (isExtended(f.pinky)) score++;
      return score / total;
    },
  },
  {
    // J is same as I (motion-based, can't distinguish statically)
    label: "J",
    match: () => 0, // Never match J statically — I takes precedence
  },
  {
    label: "K",
    match: (f) => {
      let score = 0;
      const total = 6;
      if (isExtended(f.index)) score++;
      if (isExtended(f.middle)) score++;
      if (isCurled(f.ring)) score++;
      if (isCurled(f.pinky)) score++;
      // Thumb up between index and middle
      if (f.thumb.curl < 0.3) score++;
      if (f.indexMiddleSpread) score++;
      return score / total;
    },
  },
  {
    label: "L",
    match: (f) => {
      let score = 0;
      const total = 6;
      if (isExtended(f.index)) score++;
      if (isCurled(f.middle)) score++;
      if (isCurled(f.ring)) score++;
      if (isCurled(f.pinky)) score++;
      if (isThumbOut(f.thumb)) score++;
      // Thumb and index should form an L (high abduction)
      if (f.thumb.abduction > 0.6) score++;
      return score / total;
    },
  },
  {
    label: "M",
    match: (f) => {
      let score = 0;
      const total = 5;
      if (isThumbTucked(f.thumb)) score++;
      if (isBent(f.index) || isCurled(f.index)) score++;
      if (isBent(f.middle) || isCurled(f.middle)) score++;
      if (isBent(f.ring) || isCurled(f.ring)) score++;
      if (isCurled(f.pinky)) score++;
      return score / total;
    },
  },
  {
    label: "N",
    match: (f) => {
      let score = 0;
      const total = 5;
      if (isThumbTucked(f.thumb)) score++;
      if (isBent(f.index) || isCurled(f.index)) score++;
      if (isBent(f.middle) || isCurled(f.middle)) score++;
      if (isCurled(f.ring)) score++;
      if (isCurled(f.pinky)) score++;
      return score / total;
    },
  },
  {
    label: "O",
    match: (f) => {
      let score = 0;
      const total = 5;
      // All fingers bent, tips close to thumb
      if (isBent(f.index) || isCurled(f.index)) score++;
      if (isBent(f.middle) || isCurled(f.middle)) score++;
      if (isBent(f.ring) || isCurled(f.ring)) score++;
      if (isBent(f.pinky) || isCurled(f.pinky)) score++;
      // Thumb and index tips close together (forming O)
      if (f.thumbIndexTipDist < 0.3) score++;
      return score / total;
    },
  },
  {
    label: "P",
    match: (f) => {
      // Like K but pointing down — difficult to distinguish without orientation
      // Give a small base score for the K-like shape
      let score = 0;
      const total = 5;
      if (isExtended(f.index)) score++;
      if (isExtended(f.middle)) score++;
      if (isCurled(f.ring)) score++;
      if (isCurled(f.pinky)) score++;
      if (f.thumb.curl < 0.3) score++;
      return (score / total) * 0.7; // Lower max since it overlaps with K
    },
  },
  {
    label: "Q",
    match: (f) => {
      // Like G but pointing down — similar issue
      let score = 0;
      const total = 5;
      if (isExtended(f.index) || isBent(f.index)) score++;
      if (isCurled(f.middle)) score++;
      if (isCurled(f.ring)) score++;
      if (isCurled(f.pinky)) score++;
      if (isThumbOut(f.thumb)) score++;
      return (score / total) * 0.65;
    },
  },
  {
    label: "R",
    match: (f) => {
      let score = 0;
      const total = 5;
      if (isExtended(f.index)) score++;
      if (isExtended(f.middle)) score++;
      if (isCurled(f.ring)) score++;
      if (isCurled(f.pinky)) score++;
      // Index and middle close together (crossed or touching)
      if (f.indexMiddleTipDist < 0.2) score++;
      return score / total;
    },
  },
  {
    label: "S",
    match: (f) => {
      let score = 0;
      const total = 5;
      // Fist with thumb across fingers
      if (isThumbAcross(f.thumb)) score++;
      if (isCurled(f.index)) score++;
      if (isCurled(f.middle)) score++;
      if (isCurled(f.ring)) score++;
      if (isCurled(f.pinky)) score++;
      return score / total;
    },
  },
  {
    label: "T",
    match: (f) => {
      let score = 0;
      const total = 5;
      // Fist with thumb tucked between index and middle
      if (isThumbTucked(f.thumb)) score++;
      if (isCurled(f.index)) score++;
      if (isCurled(f.middle)) score++;
      if (isCurled(f.ring)) score++;
      if (isCurled(f.pinky)) score++;
      return score / total;
    },
  },
  {
    label: "U",
    match: (f) => {
      let score = 0;
      const total = 6;
      if (isThumbTucked(f.thumb) || f.thumb.curl > 0.2) score++;
      if (isExtended(f.index)) score++;
      if (isExtended(f.middle)) score++;
      if (isCurled(f.ring)) score++;
      if (isCurled(f.pinky)) score++;
      // Fingers together (NOT spread — distinguishes from V)
      if (!f.indexMiddleSpread) score++;
      return score / total;
    },
  },
  {
    label: "V",
    match: (f) => {
      let score = 0;
      const total = 6;
      if (isThumbTucked(f.thumb) || f.thumb.curl > 0.2) score++;
      if (isExtended(f.index)) score++;
      if (isExtended(f.middle)) score++;
      if (isCurled(f.ring)) score++;
      if (isCurled(f.pinky)) score++;
      // Fingers spread (distinguishes from U)
      if (f.indexMiddleSpread) score++;
      return score / total;
    },
  },
  {
    label: "W",
    match: (f) => {
      let score = 0;
      const total = 6;
      if (isThumbTucked(f.thumb) || f.thumb.curl > 0.2) score++;
      if (isExtended(f.index)) score++;
      if (isExtended(f.middle)) score++;
      if (isExtended(f.ring)) score++;
      if (isCurled(f.pinky)) score++;
      if (f.indexMiddleSpread || f.middleRingSpread) score++;
      return score / total;
    },
  },
  {
    label: "X",
    match: (f) => {
      let score = 0;
      const total = 5;
      if (isThumbTucked(f.thumb) || f.thumb.curl > 0.2) score++;
      // Index is bent/hooked (not fully extended, not fully curled)
      if (isBent(f.index)) score++;
      if (isCurled(f.middle)) score++;
      if (isCurled(f.ring)) score++;
      if (isCurled(f.pinky)) score++;
      return score / total;
    },
  },
  {
    label: "Y",
    match: (f) => {
      let score = 0;
      const total = 5;
      if (isThumbOut(f.thumb)) score++;
      if (isCurled(f.index)) score++;
      if (isCurled(f.middle)) score++;
      if (isCurled(f.ring)) score++;
      if (isExtended(f.pinky)) score++;
      return score / total;
    },
  },
  {
    label: "Z",
    match: (f) => {
      // Z is index pointing (trace Z motion) — statically same as pointing
      let score = 0;
      const total = 5;
      if (isExtended(f.index)) score++;
      if (isCurled(f.middle)) score++;
      if (isCurled(f.ring)) score++;
      if (isCurled(f.pinky)) score++;
      if (isThumbTucked(f.thumb) || f.thumb.curl > 0.2) score++;
      return (score / total) * 0.6; // Lower priority, overlaps with D/G
    },
  },

  // ── Numbers ──────────────────────────────────────────────────────

  {
    label: "0",
    match: (f) => {
      // Same as O — fingers touch thumb forming circle
      let score = 0;
      const total = 5;
      if (f.thumbIndexTipDist < 0.3) score++;
      if (isBent(f.index) || isCurled(f.index)) score++;
      if (isBent(f.middle) || isCurled(f.middle)) score++;
      if (isBent(f.ring) || isCurled(f.ring)) score++;
      if (isBent(f.pinky) || isCurled(f.pinky)) score++;
      return (score / total) * 0.75; // Lower than O since it's the same shape
    },
  },
  {
    label: "1",
    match: (f) => {
      let score = 0;
      const total = 5;
      if (isThumbTucked(f.thumb) || f.thumb.curl > 0.2) score++;
      if (isExtended(f.index)) score++;
      if (isCurled(f.middle)) score++;
      if (isCurled(f.ring)) score++;
      if (isCurled(f.pinky)) score++;
      return (score / total) * 0.8; // Slightly lower than D
    },
  },
  {
    label: "2",
    match: (f) => {
      // Same as V/U — index + middle up
      let score = 0;
      const total = 5;
      if (isThumbTucked(f.thumb) || f.thumb.curl > 0.2) score++;
      if (isExtended(f.index)) score++;
      if (isExtended(f.middle)) score++;
      if (isCurled(f.ring)) score++;
      if (isCurled(f.pinky)) score++;
      return (score / total) * 0.75; // Lower than U/V
    },
  },
  {
    label: "3",
    match: (f) => {
      let score = 0;
      const total = 5;
      // Thumb + index + middle extended
      if (isThumbOut(f.thumb)) score++;
      if (isExtended(f.index)) score++;
      if (isExtended(f.middle)) score++;
      if (isCurled(f.ring)) score++;
      if (isCurled(f.pinky)) score++;
      return score / total;
    },
  },
  {
    label: "4",
    match: (f) => {
      let score = 0;
      const total = 5;
      if (isThumbTucked(f.thumb) || f.thumb.curl > 0.25) score++;
      if (isExtended(f.index)) score++;
      if (isExtended(f.middle)) score++;
      if (isExtended(f.ring)) score++;
      if (isExtended(f.pinky)) score++;
      return score / total;
    },
  },
  {
    label: "5",
    match: (f) => {
      let score = 0;
      const total = 6;
      if (isThumbOut(f.thumb)) score++;
      if (isExtended(f.index)) score++;
      if (isExtended(f.middle)) score++;
      if (isExtended(f.ring)) score++;
      if (isExtended(f.pinky)) score++;
      // Fingers spread
      if (f.indexMiddleSpread || f.middleRingSpread) score++;
      return score / total;
    },
  },
  {
    label: "6",
    match: (f) => {
      let score = 0;
      const total = 5;
      if (isThumbOut(f.thumb)) score++;
      if (isCurled(f.index)) score++;
      if (isCurled(f.middle)) score++;
      if (isCurled(f.ring)) score++;
      if (isExtended(f.pinky)) score++;
      return score / total;
    },
  },
  {
    label: "7",
    match: (f) => {
      let score = 0;
      const total = 5;
      if (isThumbOut(f.thumb)) score++;
      if (isCurled(f.index)) score++;
      if (isCurled(f.middle)) score++;
      if (isExtended(f.ring)) score++;
      if (isCurled(f.pinky)) score++;
      return score / total;
    },
  },
  {
    label: "8",
    match: (f) => {
      let score = 0;
      const total = 5;
      if (isThumbOut(f.thumb)) score++;
      if (isCurled(f.index)) score++;
      if (isExtended(f.middle)) score++;
      if (isCurled(f.ring)) score++;
      if (isCurled(f.pinky)) score++;
      return score / total;
    },
  },
  {
    label: "9",
    match: (f) => {
      let score = 0;
      const total = 5;
      if (isThumbOut(f.thumb) || f.thumb.curl < 0.3) score++;
      if (isExtended(f.index) || isBent(f.index)) score++;
      // Thumb and index close (forming circle)
      if (f.thumbIndexTipDist < 0.35) score++;
      if (isCurled(f.ring)) score++;
      if (isCurled(f.pinky)) score++;
      return score / total;
    },
  },
];

// ── Disambiguation Rules ───────────────────────────────────────────

/**
 * Some signs overlap (e.g., A/S/T are all fists, U/V/H/K/2 are 2 fingers up).
 * Apply tie-breaking rules when top candidates are close in score.
 */
function disambiguate(
  candidates: { label: string; score: number }[],
  f: HandFeatures
): { label: string; score: number }[] {
  // A vs S vs T (all fist variants)
  const fistGroup = ["A", "S", "T"];
  const hasFistConflict =
    candidates.filter((c) => fistGroup.includes(c.label) && c.score > 0.7)
      .length > 1;

  if (hasFistConflict) {
    for (const c of candidates) {
      if (c.label === "A" && isThumbOut(f.thumb) && !isThumbAcross(f.thumb)) {
        c.score += 0.15;
      }
      if (c.label === "S" && isThumbAcross(f.thumb)) {
        c.score += 0.15;
      }
      if (c.label === "T" && isThumbTucked(f.thumb) && !isThumbAcross(f.thumb) && !isThumbOut(f.thumb)) {
        c.score += 0.1;
      }
    }
  }

  // U vs V (together vs spread)
  const uvGroup = ["U", "V"];
  const hasUVConflict =
    candidates.filter((c) => uvGroup.includes(c.label) && c.score > 0.7)
      .length > 1;

  if (hasUVConflict) {
    for (const c of candidates) {
      if (c.label === "V" && f.indexMiddleSpread) c.score += 0.15;
      if (c.label === "U" && !f.indexMiddleSpread) c.score += 0.15;
    }
  }

  // H vs U (H has thumb tucked, U also does — differentiate by orientation)
  // K vs V (K has thumb up/between)
  const kvGroup = ["K", "V"];
  const hasKVConflict =
    candidates.filter((c) => kvGroup.includes(c.label) && c.score > 0.7)
      .length > 1;

  if (hasKVConflict) {
    for (const c of candidates) {
      if (c.label === "K" && f.thumb.curl < 0.2 && f.thumb.abduction > 0.4)
        c.score += 0.12;
      if (c.label === "V" && (f.thumb.curl > 0.25 || f.thumb.abduction < 0.4))
        c.score += 0.12;
    }
  }

  // G vs L vs D (index up + thumb position varies)
  const gldGroup = ["G", "L", "D"];
  const hasGLDConflict =
    candidates.filter((c) => gldGroup.includes(c.label) && c.score > 0.7)
      .length > 1;

  if (hasGLDConflict) {
    for (const c of candidates) {
      // L: thumb far out (high abduction)
      if (c.label === "L" && f.thumb.abduction > 0.7) c.score += 0.15;
      // D: thumb touches middle/ring area
      if (c.label === "D" && isThumbAcross(f.thumb)) c.score += 0.12;
      // G: thumb extended but not as far as L
      if (
        c.label === "G" &&
        f.thumb.abduction > 0.4 &&
        f.thumb.abduction < 0.7
      )
        c.score += 0.1;
    }
  }

  // E vs M vs N (all curled variants)
  const emnGroup = ["E", "M", "N"];
  const hasEMNConflict =
    candidates.filter((c) => emnGroup.includes(c.label) && c.score > 0.7)
      .length > 1;

  if (hasEMNConflict) {
    // E: all bent, M: 3 fingers over thumb, N: 2 fingers over thumb
    // Hard to distinguish — prefer E for simplicity unless thumb is clearly tucked under
    for (const c of candidates) {
      if (c.label === "E") c.score += 0.08;
    }
  }

  // 6 vs Y (both thumb + pinky out)
  const sixYGroup = ["6", "Y"];
  const has6YConflict =
    candidates.filter((c) => sixYGroup.includes(c.label) && c.score > 0.7)
      .length > 1;

  if (has6YConflict) {
    // Prefer Y for alphabet, 6 for numbers — prefer Y as default
    for (const c of candidates) {
      if (c.label === "Y") c.score += 0.1;
    }
  }

  return candidates;
}

// ── Main Classification Function ───────────────────────────────────

// Frame smoothing buffer
const BUFFER_SIZE = 4;
let predictionBuffer: string[] = [];

export function classifyISLSign(
  landmarks: HandLandmark[]
): { label: string; confidence: number } | null {
  if (landmarks.length < 21) return null;

  const features = extractFeatures(landmarks);

  // Score all signs
  let candidates = ISL_SIGNS.map((rule) => ({
    label: rule.label,
    score: rule.match(features),
  })).filter((c) => c.score > 0.55);

  if (candidates.length === 0) return null;

  // Apply disambiguation
  candidates = disambiguate(candidates, features);

  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score);

  const best = candidates[0];
  if (best.score < 0.6) return null;

  // Frame smoothing: require consistent prediction
  predictionBuffer.push(best.label);
  if (predictionBuffer.length > BUFFER_SIZE) {
    predictionBuffer.shift();
  }

  // Need at least 3 frames of consistent prediction
  if (predictionBuffer.length >= 3) {
    const last3 = predictionBuffer.slice(-3);
    const allSame = last3.every((p) => p === best.label);
    if (allSame) {
      return {
        label: best.label,
        confidence: Math.min(0.95, best.score),
      };
    }
  }

  // If buffer isn't consistent yet, still return with lower confidence
  if (predictionBuffer.length >= 2) {
    const last2 = predictionBuffer.slice(-2);
    if (last2.every((p) => p === best.label)) {
      return {
        label: best.label,
        confidence: Math.min(0.85, best.score * 0.85),
      };
    }
  }

  return null;
}

export function resetISLClassifier(): void {
  predictionBuffer = [];
}
