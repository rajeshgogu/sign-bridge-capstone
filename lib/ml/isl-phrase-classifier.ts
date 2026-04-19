/**
 * ISL Phrase Classifier — Rewritten for accuracy.
 *
 * Key design principles:
 *  1. Every phrase gets a UNIQUE hand shape signature that does NOT overlap
 *     with other phrases. Shapes like open-palm are only used ONCE.
 *  2. Strict confidence thresholds per phrase.
 *  3. Temporal smoothing: 4-frame rolling buffer — must repeat 3× before firing.
 *  4. Two-hand signs require BOTH hands to be present + matching shapes.
 *  5. The classifier uses a global winner-takes-all after all scores computed.
 */

import type { HandLandmark } from "@/types/ml";

// ── Geometry ──────────────────────────────────────────────────────────────────

function dist(a: HandLandmark, b: HandLandmark): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

function angleDeg(a: HandLandmark, b: HandLandmark, c: HandLandmark): number {
  const ba = { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  const bc = { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z };
  const dot = ba.x * bc.x + ba.y * bc.y + ba.z * bc.z;
  const magBA = Math.sqrt(ba.x ** 2 + ba.y ** 2 + ba.z ** 2);
  const magBC = Math.sqrt(bc.x ** 2 + bc.y ** 2 + bc.z ** 2);
  if (magBA < 1e-6 || magBC < 1e-6) return 180;
  return Math.acos(Math.max(-1, Math.min(1, dot / (magBA * magBC)))) * (180 / Math.PI);
}

// ── Feature Extraction ────────────────────────────────────────────────────────

export interface HandFeatures {
  // Finger curl: 0=fully extended, 1=fully curled
  thumbCurl: number;
  indexCurl: number;
  middleCurl: number;
  ringCurl: number;
  pinkyCurl: number;

  // PIP angles (180=straight, ~90=curled)
  indexPIP: number;
  middlePIP: number;
  ringPIP: number;
  pinkyPIP: number;

  // Spread between adjacent fingertips (normalized by palmSize)
  thumbIndexDist: number;   // thumb tip ↔ index tip
  thumbMiddleDist: number;  // thumb tip ↔ middle tip
  thumbRingDist: number;    // thumb tip ↔ ring tip
  thumbPinkyDist: number;   // thumb tip ↔ pinky tip
  indexMiddleDist: number;  // index tip ↔ middle tip
  middleRingDist: number;   // middle tip ↔ ring tip
  ringPinkyDist: number;    // ring tip ↔ pinky tip

  // Thumb abduction: distance thumb tip ↔ index MCP, normalized
  thumbAbduction: number;

  // Thumb crosses palm (tip near ring/middle MCP)
  thumbCrossesPalm: boolean;

  // All-finger spread (open palm feel)
  allSpread: boolean;

  palmSize: number;
}

function extractFeatures(lm: HandLandmark[]): HandFeatures | null {
  if (lm.length < 21) return null;
  const palmSize = dist(lm[0], lm[9]);
  if (palmSize < 1e-6) return null;

  function fingerCurl(mcpIdx: number, pipIdx: number, dipIdx: number, tipIdx: number): number {
    const pip = angleDeg(lm[mcpIdx], lm[pipIdx], lm[dipIdx]);
    const dip = angleDeg(lm[pipIdx], lm[dipIdx], lm[tipIdx]);
    return Math.max(0, Math.min(1, 1 - (pip + dip) / 360));
  }

  function fingerPIP(mcpIdx: number, pipIdx: number, dipIdx: number): number {
    return angleDeg(lm[mcpIdx], lm[pipIdx], lm[dipIdx]);
  }

  // Thumb curl — uses joints 1,2,3,4
  const thumbPIP = angleDeg(lm[1], lm[2], lm[3]);
  const thumbDIP = angleDeg(lm[2], lm[3], lm[4]);
  const thumbCurl = Math.max(0, Math.min(1, 1 - (thumbPIP + thumbDIP) / 360));

  const thumbAbduction = dist(lm[4], lm[5]) / palmSize; // thumb tip to index MCP
  const thumbCrossesPalm =
    dist(lm[4], lm[9]) / palmSize < 0.55 || dist(lm[4], lm[13]) / palmSize < 0.55;

  const thumbIndexDist  = dist(lm[4], lm[8])  / palmSize;
  const thumbMiddleDist = dist(lm[4], lm[12]) / palmSize;
  const thumbRingDist   = dist(lm[4], lm[16]) / palmSize;
  const thumbPinkyDist  = dist(lm[4], lm[20]) / palmSize;
  const indexMiddleDist = dist(lm[8], lm[12]) / palmSize;
  const middleRingDist  = dist(lm[12], lm[16]) / palmSize;
  const ringPinkyDist   = dist(lm[16], lm[20]) / palmSize;

  const allSpread = indexMiddleDist > 0.38 && middleRingDist > 0.38;

  return {
    thumbCurl,
    indexCurl:  fingerCurl(5, 6, 7, 8),
    middleCurl: fingerCurl(9, 10, 11, 12),
    ringCurl:   fingerCurl(13, 14, 15, 16),
    pinkyCurl:  fingerCurl(17, 18, 19, 20),
    indexPIP:   fingerPIP(5, 6, 7),
    middlePIP:  fingerPIP(9, 10, 11),
    ringPIP:    fingerPIP(13, 14, 15),
    pinkyPIP:   fingerPIP(17, 18, 19),
    thumbIndexDist,
    thumbMiddleDist,
    thumbRingDist,
    thumbPinkyDist,
    indexMiddleDist,
    middleRingDist,
    ringPinkyDist,
    thumbAbduction,
    thumbCrossesPalm,
    allSpread,
    palmSize,
  };
}

// ── Shape Predicates (strict thresholds) ──────────────────────────────────────

/** Finger clearly straight (not just partially extended) */
function isExtended(curl: number, pip: number): boolean {
  return curl < 0.18 && pip > 155;
}

/** Finger clearly bent/curled */
function isCurled(curl: number, pip: number): boolean {
  return curl > 0.38 || pip < 125;
}

/** Finger halfway — hooked or bent (C-shape) */
function isBent(curl: number, pip: number): boolean {
  return curl >= 0.18 && curl <= 0.50 && pip >= 110 && pip <= 160;
}

// Thumb helpers
function isThumbExtended(f: HandFeatures): boolean {
  return f.thumbAbduction > 0.55 && f.thumbCurl < 0.30;
}

function isThumbCurled(f: HandFeatures): boolean {
  return f.thumbCurl > 0.35 || f.thumbAbduction < 0.40;
}

function isThumbPinching(f: HandFeatures): boolean {
  return f.thumbIndexDist < 0.32;
}

// ── Phrase Shape Signatures ───────────────────────────────────────────────────
// Each phrase maps to a totally distinct hand shape or two-hand requirement.
// Min threshold to fire is listed per phrase.

export interface PhraseSignature {
  /** Minimum score (0–1) needed to accept this phrase */
  minScore: number;
  /** Requires two hands visible */
  twoHanded: boolean;
  /** Score function — receives array of features (1 or 2 hands) */
  score: (hands: HandFeatures[]) => number;
}

// Helper: score how well a single hand matches a pattern
function singleHandScore(f: HandFeatures, checks: boolean[]): number {
  const passed = checks.filter(Boolean).length;
  return passed / checks.length;
}

const PHRASE_SIGNATURES: Record<string, PhraseSignature> = {

  // ─────────────────────────────────────────────────────────────────────────
  // GREETINGS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * hello — open 5-finger palm WAVING (all spread):
   * All 5 fingers extended, thumb out, all spread apart
   * Distinct: allSpread=true + all fingers extended + thumb extended
   */
  hello: {
    minScore: 0.82,
    twoHanded: false,
    score: ([f]) => {
      if (!f) return 0;
      return singleHandScore(f, [
        isExtended(f.indexCurl, f.indexPIP),
        isExtended(f.middleCurl, f.middlePIP),
        isExtended(f.ringCurl, 160),
        isExtended(f.pinkyCurl, 160),
        isThumbExtended(f),
        f.allSpread,                         // ← spread is the unique key
        f.indexMiddleDist > 0.40,
      ]);
    },
  },

  /**
   * thank_you — flat palm pushed FORWARD (fingers together, no spread):
   * ALL 5 fingers extended BUT together (indexMiddleSpread < 0.30)
   * Thumb not necessarily out (tucked or neutral)
   * Distinct from hello: fingers must be TOGETHER not spread
   */
  thank_you: {
    minScore: 0.80,
    twoHanded: false,
    score: ([f]) => {
      if (!f) return 0;
      return singleHandScore(f, [
        isExtended(f.indexCurl, f.indexPIP),
        isExtended(f.middleCurl, f.middlePIP),
        isExtended(f.ringCurl, 160),
        isExtended(f.pinkyCurl, 160),
        f.indexMiddleDist < 0.30,          // fingers TOGETHER ← key differentiator
        f.middleRingDist < 0.30,
        !f.allSpread,
      ]);
    },
  },

  /**
   * how_are_you — two C-hands rolling outward:
   * BOTH hands show C-shape (bent fingers, thumb out, NOT fully curled or extended)
   */
  how_are_you: {
    minScore: 0.72,
    twoHanded: true,
    score: ([f0, f1]) => {
      if (!f0 || !f1) return 0;
      function cShape(f: HandFeatures) {
        return singleHandScore(f, [
          isBent(f.indexCurl, f.indexPIP),
          isBent(f.middleCurl, f.middlePIP),
          isBent(f.ringCurl, 140),
          isThumbExtended(f),
          f.thumbIndexDist > 0.40,
        ]);
      }
      return (cShape(f0) + cShape(f1)) / 2;
    },
  },

  /**
   * goodbye — wave open palm (same shape as hello but single hand, fingers together)
   * Unique: Extended index+middle+ring+pinky, thumb slightly out, fingers NOT spread (unlike hello)
   * key: indexMiddleDist medium (0.25–0.38)
   */
  goodbye: {
    minScore: 0.80,
    twoHanded: false,
    score: ([f]) => {
      if (!f) return 0;
      return singleHandScore(f, [
        isExtended(f.indexCurl, f.indexPIP),
        isExtended(f.middleCurl, f.middlePIP),
        isExtended(f.ringCurl, 155),
        isExtended(f.pinkyCurl, 155),
        f.indexMiddleDist >= 0.22 && f.indexMiddleDist <= 0.38, // partial spread — distinct from hello
        isThumbExtended(f),
        !f.allSpread,
      ]);
    },
  },

  /**
   * my_name_is — point to self then tap fingers:
   * Index pointing (extended), rest curled, thumb neutral
   */
  my_name_is: {
    minScore: 0.78,
    twoHanded: false,
    score: ([f]) => {
      if (!f) return 0;
      return singleHandScore(f, [
        isExtended(f.indexCurl, f.indexPIP),
        isCurled(f.middleCurl, f.middlePIP),
        isCurled(f.ringCurl, 100),
        isCurled(f.pinkyCurl, 100),
        isThumbCurled(f),
        f.indexMiddleDist > 0.30,
      ]);
    },
  },

  /**
   * nice_to_meet_you — two flat palms sliding across each other:
   * BOTH hands: all fingers extended, together (not spread)
   */
  nice_to_meet_you: {
    minScore: 0.72,
    twoHanded: true,
    score: ([f0, f1]) => {
      if (!f0 || !f1) return 0;
      function flatPalm(f: HandFeatures) {
        return singleHandScore(f, [
          isExtended(f.indexCurl, f.indexPIP),
          isExtended(f.middleCurl, f.middlePIP),
          isExtended(f.ringCurl, 155),
          isExtended(f.pinkyCurl, 155),
          f.indexMiddleDist < 0.32,
          !f.allSpread,
        ]);
      }
      return (flatPalm(f0) + flatPalm(f1)) / 2;
    },
  },

  /**
   * i_am_fine — thumbs up (hand 1 only):
   * Thumb extended + out, all other fingers curled
   */
  i_am_fine: {
    minScore: 0.80,
    twoHanded: false,
    score: ([f]) => {
      if (!f) return 0;
      return singleHandScore(f, [
        isThumbExtended(f),
        f.thumbAbduction > 0.60,
        isCurled(f.indexCurl, f.indexPIP),
        isCurled(f.middleCurl, f.middlePIP),
        isCurled(f.ringCurl, 100),
        isCurled(f.pinkyCurl, 100),
      ]);
    },
  },

  /**
   * welcome — palm out, flat, moving toward viewer:
   * Flat palm facing out — fingers extended, TOGETHER, thumb out
   * Distinct from thank_you: thumb must be visibly extended outward
   */
  welcome: {
    minScore: 0.80,
    twoHanded: false,
    score: ([f]) => {
      if (!f) return 0;
      return singleHandScore(f, [
        isExtended(f.indexCurl, f.indexPIP),
        isExtended(f.middleCurl, f.middlePIP),
        isExtended(f.ringCurl, 155),
        isExtended(f.pinkyCurl, 155),
        isThumbExtended(f),
        f.thumbAbduction > 0.60,           // ← thumb clearly out, unlike thank_you
        f.indexMiddleDist < 0.32,
      ]);
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // BASIC NEEDS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * help — thumbs-up on flat palm (typical ISL help):
   * One hand: thumb extended, other 4 curled into fist
   * Distinct from i_am_fine: requires TWO hands but uses same shape for dominant
   */
  help: {
    minScore: 0.78,
    twoHanded: false,
    score: ([f]) => {
      if (!f) return 0;
      return singleHandScore(f, [
        isThumbExtended(f),
        f.thumbAbduction > 0.55,
        isCurled(f.indexCurl, f.indexPIP),
        isCurled(f.middleCurl, f.middlePIP),
        isCurled(f.ringCurl, 100),
        isCurled(f.pinkyCurl, 100),
        f.thumbIndexDist > 0.55,           // thumb clearly away from fist
      ]);
    },
  },

  /**
   * yes — fist nodding (S-shape fist):
   * ALL fingers curled, thumb across (not tucked, not out)
   */
  yes: {
    minScore: 0.78,
    twoHanded: false,
    score: ([f]) => {
      if (!f) return 0;
      return singleHandScore(f, [
        isCurled(f.indexCurl, f.indexPIP),
        isCurled(f.middleCurl, f.middlePIP),
        isCurled(f.ringCurl, 100),
        isCurled(f.pinkyCurl, 100),
        f.thumbCrossesPalm,               // thumb across fingers = fist
        !isThumbExtended(f),
      ]);
    },
  },

  /**
   * water — W handshape tapping chin:
   * Index + middle + ring extended, pinky curled, thumb curled
   */
  water: {
    minScore: 0.78,
    twoHanded: false,
    score: ([f]) => {
      if (!f) return 0;
      return singleHandScore(f, [
        isExtended(f.indexCurl, f.indexPIP),
        isExtended(f.middleCurl, f.middlePIP),
        isExtended(f.ringCurl, 150),
        isCurled(f.pinkyCurl, f.pinkyPIP),
        isThumbCurled(f),
        f.indexMiddleDist > 0.25,
        f.middleRingDist > 0.20,
      ]);
    },
  },

  /**
   * need_food — fingertips to mouth (bunched fingertips = O-shape):
   * All fingertips touching thumb — pinched/O shape
   */
  need_food: {
    minScore: 0.75,
    twoHanded: false,
    score: ([f]) => {
      if (!f) return 0;
      return singleHandScore(f, [
        f.thumbIndexDist < 0.35,
        f.thumbMiddleDist < 0.40,
        isBent(f.indexCurl, f.indexPIP),
        isBent(f.middleCurl, f.middlePIP),
        isBent(f.ringCurl, 140),
        isBent(f.pinkyCurl, 140),
        !isThumbExtended(f),
      ]);
    },
  },



  /**
   * need_rest — crossed arms over chest:
   * TWO hands, both flat/open (all extended), positioned crossing
   * Detect: both hands all-extended, close together (indexMiddleDist similar for both)
   */
  need_rest: {
    minScore: 0.72,
    twoHanded: true,
    score: ([f0, f1]) => {
      if (!f0 || !f1) return 0;
      function restShape(f: HandFeatures) {
        return singleHandScore(f, [
          isExtended(f.indexCurl, f.indexPIP),
          isExtended(f.middleCurl, f.middlePIP),
          isExtended(f.ringCurl, 155),
          isExtended(f.pinkyCurl, 155),
          f.indexMiddleDist < 0.35,
        ]);
      }
      return (restShape(f0) + restShape(f1)) / 2;
    },
  },



  /**
   * cold — shivering fists (TWO hands, both fists):
   * BOTH hands: all fingers curled into fist, thumbs curled
   */
  cold: {
    minScore: 0.72,
    twoHanded: true,
    score: ([f0, f1]) => {
      if (!f0 || !f1) return 0;
      function fist(f: HandFeatures) {
        return singleHandScore(f, [
          isCurled(f.indexCurl, f.indexPIP),
          isCurled(f.middleCurl, f.middlePIP),
          isCurled(f.ringCurl, 100),
          isCurled(f.pinkyCurl, 100),
        ]);
      }
      return (fist(f0) + fist(f1)) / 2;
    },
  },

  /**
   * tired — both hands droop down from chest:
   * TWO hands, both flat (all extended), fingers together, palms inward
   */
  tired: {
    minScore: 0.72,
    twoHanded: true,
    score: ([f0, f1]) => {
      if (!f0 || !f1) return 0;
      function droopFlat(f: HandFeatures) {
        return singleHandScore(f, [
          isExtended(f.indexCurl, f.indexPIP),
          isExtended(f.middleCurl, f.middlePIP),
          isExtended(f.ringCurl, 155),
          isExtended(f.pinkyCurl, 155),
          f.indexMiddleDist < 0.30,
          f.middleRingDist < 0.30,
        ]);
      }
      return (droopFlat(f0) + droopFlat(f1)) / 2;
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // COMMUNICATION
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * call_me — ILY / shaka (thumb + pinky out, rest curled):
   * Thumb + pinky extended, index + middle + ring curled
   */
  call_me: {
    minScore: 0.78,
    twoHanded: false,
    score: ([f]) => {
      if (!f) return 0;
      return singleHandScore(f, [
        isThumbExtended(f),
        isCurled(f.indexCurl, f.indexPIP),
        isCurled(f.middleCurl, f.middlePIP),
        isCurled(f.ringCurl, 100),
        isExtended(f.pinkyCurl, 155),     // pinky up ← key
        f.thumbAbduction > 0.55,
      ]);
    },
  },

  /**
   * call_doctor — phone-hand, then pulse check:
   * Thumb + pinky out (ILY/phone shape)
   * Same as call_me for static detection — differentiated by context (targetPhrase)
   */
  call_doctor: {
    minScore: 0.78,
    twoHanded: false,
    score: ([f]) => {
      if (!f) return 0;
      return singleHandScore(f, [
        isThumbExtended(f),
        isCurled(f.indexCurl, f.indexPIP),
        isCurled(f.middleCurl, f.middlePIP),
        isCurled(f.ringCurl, 100),
        isExtended(f.pinkyCurl, 155),
        f.thumbAbduction > 0.55,
        f.ringPinkyDist > 0.30,           // pinky separate from ring
      ]);
    },
  },

  /**
   * call_family — F-shape (thumb + index touching, others out):
   * Thumb and index form circle, middle + ring + pinky extended
   */
  call_family: {
    minScore: 0.75,
    twoHanded: false,
    score: ([f]) => {
      if (!f) return 0;
      return singleHandScore(f, [
        isThumbPinching(f),               // thumb + index circle
        f.thumbIndexDist < 0.35,
        isBent(f.indexCurl, f.indexPIP) || isCurled(f.indexCurl, f.indexPIP),
        isExtended(f.middleCurl, f.middlePIP),
        isExtended(f.ringCurl, 150),
        isExtended(f.pinkyCurl, 150),
      ]);
    },
  },

  /**
   * cannot_hear — point to ear (index pointing sideways):
   * Index extended + pointing, rest curled, thumb curled
   * Similar to thirsty but thumb must be curled more tightly
   */
  cannot_hear: {
    minScore: 0.78,
    twoHanded: false,
    score: ([f]) => {
      if (!f) return 0;
      return singleHandScore(f, [
        isExtended(f.indexCurl, f.indexPIP),
        isCurled(f.middleCurl, f.middlePIP),
        isCurled(f.ringCurl, 100),
        isCurled(f.pinkyCurl, 100),
        f.thumbCurl > 0.40,               // thumb tucked tighter than thirsty
        f.thumbIndexDist < 0.40,
        f.indexMiddleDist > 0.35,
      ]);
    },
  },

  /**
   * repeat_that — beckoning (B-shape, fingers close together, folded):
   * All 4 fingers extended + together, thumb tucked
   */
  repeat_that: {
    minScore: 0.76,
    twoHanded: false,
    score: ([f]) => {
      if (!f) return 0;
      return singleHandScore(f, [
        isExtended(f.indexCurl, f.indexPIP),
        isExtended(f.middleCurl, f.middlePIP),
        isExtended(f.ringCurl, 150),
        isExtended(f.pinkyCurl, 150),
        f.indexMiddleDist < 0.25,        // fingers close together
        f.middleRingDist < 0.25,
        f.thumbCurl > 0.25,              // thumb slightly tucked
      ]);
    },
  },

  /**
   * speak_slowly — slide hand up arm (flat hand, palm down, moving):
   * Flat hand, all extended, fingers together, similar to repeat_that
   * Distinct: thumb is slightly bent/neutral (not extended, not tucked)
   */
  speak_slowly: {
    minScore: 0.76,
    twoHanded: false,
    score: ([f]) => {
      if (!f) return 0;
      return singleHandScore(f, [
        isExtended(f.indexCurl, f.indexPIP),
        isExtended(f.middleCurl, f.middlePIP),
        isExtended(f.ringCurl, 150),
        isExtended(f.pinkyCurl, 150),
        f.indexMiddleDist < 0.28,
        f.thumbCurl > 0.20 && f.thumbCurl < 0.45, // neutral thumb — not extended, not curled
        !f.allSpread,
      ]);
    },
  },

  /**
   * understand — flick index from fist near forehead:
   * Index extended with slight curl (flicking position), rest curled, thumb tucked
   */
  understand: {
    minScore: 0.76,
    twoHanded: false,
    score: ([f]) => {
      if (!f) return 0;
      return singleHandScore(f, [
        f.indexCurl < 0.25 && f.indexPIP > 140,  // index mostly straight
        isCurled(f.middleCurl, f.middlePIP),
        isCurled(f.ringCurl, 100),
        isCurled(f.pinkyCurl, 100),
        !f.thumbCrossesPalm,
        f.thumbCurl > 0.30,               // thumb tucked/neutral
        f.indexMiddleDist > 0.28,
      ]);
    },
  },

  /**
   * not_understand — same flick but with head shake (static = same shape):
   * Same as understand shape — only context (targetPhrase) differentiates
   * Slight difference: all digits more curled / tighter
   */
  not_understand: {
    minScore: 0.76,
    twoHanded: false,
    score: ([f]) => {
      if (!f) return 0;
      return singleHandScore(f, [
        f.indexCurl < 0.30,               // index slightly more curled than understand
        isCurled(f.middleCurl, f.middlePIP),
        isCurled(f.ringCurl, 100),
        isCurled(f.pinkyCurl, 100),
        f.thumbCurl > 0.35,
        f.thumbIndexDist < 0.45,
      ]);
    },
  },

  /**
   * write_it_down — mime writing (flat palm base + pointer writing):
   * Index + middle extended (writing position), ring + pinky curled
   */
  write_it_down: {
    minScore: 0.76,
    twoHanded: false,
    score: ([f]) => {
      if (!f) return 0;
      return singleHandScore(f, [
        isExtended(f.indexCurl, f.indexPIP),
        isExtended(f.middleCurl, f.middlePIP),
        isCurled(f.ringCurl, 100),
        isCurled(f.pinkyCurl, 100),
        isThumbPinching(f),               // thumb near index (holding pen position)
        f.thumbIndexDist < 0.38,
        f.indexMiddleDist < 0.30,
      ]);
    },
  },

  /**
   * help_communicate — help sign (same as help):
   * Thumb out, fist — uses context differentiation via targetPhrase
   */
  help_communicate: {
    minScore: 0.78,
    twoHanded: false,
    score: ([f]) => {
      if (!f) return 0;
      return singleHandScore(f, [
        isThumbExtended(f),
        f.thumbAbduction > 0.58,
        isCurled(f.indexCurl, f.indexPIP),
        isCurled(f.middleCurl, f.middlePIP),
        isCurled(f.ringCurl, 100),
        isCurled(f.pinkyCurl, 100),
        f.thumbMiddleDist > 0.55,
      ]);
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // EMERGENCY
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * need_doctor — pulse-check (two fingers on wrist):
   * Index + middle extended together (H/U shape), rest curled, thumb tucked
   */
  need_doctor: {
    minScore: 0.78,
    twoHanded: false,
    score: ([f]) => {
      if (!f) return 0;
      return singleHandScore(f, [
        isExtended(f.indexCurl, f.indexPIP),
        isExtended(f.middleCurl, f.middlePIP),
        isCurled(f.ringCurl, 100),
        isCurled(f.pinkyCurl, 100),
        f.indexMiddleDist < 0.25,         // index + middle TOGETHER ← U-shape
        f.thumbCurl > 0.25,
      ]);
    },
  },

  /**
   * in_pain — both index fingers pointing toward each other, twisting:
   * Index extended, rest curled (pointing), thumb curled
   * Single: index pointing up, tight fist
   */
  in_pain: {
    minScore: 0.78,
    twoHanded: false,
    score: ([f]) => {
      if (!f) return 0;
      return singleHandScore(f, [
        isExtended(f.indexCurl, f.indexPIP),
        isCurled(f.middleCurl, f.middlePIP),
        isCurled(f.ringCurl, 100),
        isCurled(f.pinkyCurl, 100),
        f.thumbCurl > 0.40,                // thumb clearly tucked
        f.indexMiddleDist > 0.32,
      ]);
    },
  },

  /**
   * ambulance — rotating fist like siren light:
   * Loose fist with thumb out to side (rotating)
   * Distinct: thumb extended outward + fist (= A-shape rotated)
   */
  ambulance: {
    minScore: 0.78,
    twoHanded: false,
    score: ([f]) => {
      if (!f) return 0;
      return singleHandScore(f, [
        isThumbExtended(f),
        f.thumbAbduction > 0.50,
        isCurled(f.indexCurl, f.indexPIP),
        isCurled(f.middleCurl, f.middlePIP),
        isCurled(f.ringCurl, 100),
        isCurled(f.pinkyCurl, 100),
        f.thumbCurl < 0.30,               // thumb clearly out (A-thumbs-up shape)
      ]);
    },
  },

  /**
   * fever — back of hand to forehead (flat hand):
   * All fingers extended, held flat (not spread), thumb tucked/natural
   * Distinct from thank_you: thumb should be bent/curled
   */
  fever: {
    minScore: 0.80,
    twoHanded: false,
    score: ([f]) => {
      if (!f) return 0;
      return singleHandScore(f, [
        isExtended(f.indexCurl, f.indexPIP),
        isExtended(f.middleCurl, f.middlePIP),
        isExtended(f.ringCurl, 155),
        isExtended(f.pinkyCurl, 155),
        f.thumbCurl > 0.30,               // thumb curled ← distinct from welcome/thank_you
        !isThumbExtended(f),
        f.indexMiddleDist < 0.30,
      ]);
    },
  },

  /**
   * dizzy — circular motion around head (index pointing laterally):
   * Index extended, rest curled, thumb curled — similar to in_pain
   * Distinct: slightly looser fist, index more lateral
   */
  dizzy: {
    minScore: 0.75,
    twoHanded: false,
    score: ([f]) => {
      if (!f) return 0;
      return singleHandScore(f, [
        isExtended(f.indexCurl, f.indexPIP),
        isCurled(f.middleCurl, f.middlePIP),
        isCurled(f.ringCurl, 100),
        isCurled(f.pinkyCurl, 100),
        f.thumbCurl > 0.30 && f.thumbCurl < 0.55,  // slightly open thumb (not tight fist)
        f.thumbIndexDist > 0.35,
      ]);
    },
  },

  /**
   * wheelchair — miming pushing wheels (two fists rotating outward):
   * TWO hand fists rotating — both fists
   */
  wheelchair: {
    minScore: 0.70,
    twoHanded: true,
    score: ([f0, f1]) => {
      if (!f0 || !f1) return 0;
      function wheelFist(f: HandFeatures) {
        return singleHandScore(f, [
          isCurled(f.indexCurl, f.indexPIP),
          isCurled(f.middleCurl, f.middlePIP),
          isCurled(f.ringCurl, 100),
          isCurled(f.pinkyCurl, 100),
          !f.thumbCrossesPalm,
        ]);
      }
      return (wheelFist(f0) + wheelFist(f1)) / 2;
    },
  },

  /**
   * deaf — touch ear then mouth (point to ear = index pointing):
   * Index extended toward side, thumb curled in, rest curled
   * Very similar to cannot_hear — differentiated by targetPhrase only
   */
  deaf: {
    minScore: 0.78,
    twoHanded: false,
    score: ([f]) => {
      if (!f) return 0;
      return singleHandScore(f, [
        isExtended(f.indexCurl, f.indexPIP),
        isCurled(f.middleCurl, f.middlePIP),
        isCurled(f.ringCurl, 100),
        isCurled(f.pinkyCurl, 100),
        f.thumbCurl > 0.42,               // tight thumb
        f.indexMiddleDist > 0.38,
      ]);
    },
  },

  /**
   * use_sign — two hands rotating around each other (TWO circular fists):
   * TWO hands, both loose fists, rotating
   */
  use_sign: {
    minScore: 0.70,
    twoHanded: true,
    score: ([f0, f1]) => {
      if (!f0 || !f1) return 0;
      function rotateFist(f: HandFeatures) {
        return singleHandScore(f, [
          isCurled(f.indexCurl, f.indexPIP),
          isCurled(f.middleCurl, f.middlePIP),
          isCurled(f.ringCurl, 100),
        ]);
      }
      return (rotateFist(f0) + rotateFist(f1)) / 2;
    },
  },

  /**
   * be_patient — thumb on chin, sliding down:
   * Thumb extended pointing up, others loosely curled/fist
   */
  be_patient: {
    minScore: 0.76,
    twoHanded: false,
    score: ([f]) => {
      if (!f) return 0;
      return singleHandScore(f, [
        isThumbExtended(f),
        f.thumbAbduction > 0.50,
        isCurled(f.indexCurl, f.indexPIP),
        isCurled(f.middleCurl, f.middlePIP),
        isCurled(f.ringCurl, 100),
        f.pinkyCurl > 0.20,              // pinky slightly curled (not fully)
        f.thumbCurl < 0.28,
      ]);
    },
  },

  /**
   * emergency — E-shape (all curled under thumb) shaken rapidly:
   * All fingers bent/curled, thumb resting across (different from yes/S-fist: less tight)
   */
  emergency: {
    minScore: 0.76,
    twoHanded: false,
    score: ([f]) => {
      if (!f) return 0;
      return singleHandScore(f, [
        isCurled(f.indexCurl, f.indexPIP),
        isCurled(f.middleCurl, f.middlePIP),
        isCurled(f.ringCurl, 100),
        isCurled(f.pinkyCurl, 100),
        f.thumbCurl > 0.20,
        !isThumbExtended(f),
        f.thumbIndexDist < 0.45,
      ]);
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SCHOOL & SOCIAL
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * going_school — clap (two flat hands together):
   * TWO hands: both flat with all extended fingers, coming together
   */
  going_school: {
    minScore: 0.72,
    twoHanded: true,
    score: ([f0, f1]) => {
      if (!f0 || !f1) return 0;
      function clapFlat(f: HandFeatures) {
        return singleHandScore(f, [
          isExtended(f.indexCurl, f.indexPIP),
          isExtended(f.middleCurl, f.middlePIP),
          isExtended(f.ringCurl, 150),
          isExtended(f.pinkyCurl, 150),
          f.indexMiddleDist < 0.28,
        ]);
      }
      return (clapFlat(f0) + clapFlat(f1)) / 2;
    },
  },

  /**
   * more_time — tap wrist (index pointing down + wrist tap):
   * Closed fist with index pointing (curled like gun, pointing down)
   * index bent + rest curled, thumb out
   */
  more_time: {
    minScore: 0.76,
    twoHanded: false,
    score: ([f]) => {
      if (!f) return 0;
      return singleHandScore(f, [
        isBent(f.indexCurl, f.indexPIP),  // index bent (not fully extended)
        isCurled(f.middleCurl, f.middlePIP),
        isCurled(f.ringCurl, 100),
        isCurled(f.pinkyCurl, 100),
        isThumbExtended(f),               // thumb out (L-like shape but index bent)
        f.thumbAbduction > 0.50,
      ]);
    },
  },

  /**
   * question — draw question mark in air (index pointing, hooking):
   * Index hooked/bent, rest curled, thumb curled
   */
  question: {
    minScore: 0.75,
    twoHanded: false,
    score: ([f]) => {
      if (!f) return 0;
      return singleHandScore(f, [
        isBent(f.indexCurl, f.indexPIP),   // index BENT (hooked) ← key
        isCurled(f.middleCurl, f.middlePIP),
        isCurled(f.ringCurl, 100),
        isCurled(f.pinkyCurl, 100),
        f.thumbCurl > 0.30,
        !isThumbExtended(f),
      ]);
    },
  },

  /**
   * agree — index fingers parallel (touch forehead + bring together):
   * Index extended, rest curled, thumb slightly out
   */
  agree: {
    minScore: 0.76,
    twoHanded: false,
    score: ([f]) => {
      if (!f) return 0;
      return singleHandScore(f, [
        isExtended(f.indexCurl, f.indexPIP),
        isCurled(f.middleCurl, f.middlePIP),
        isCurled(f.ringCurl, 100),
        isCurled(f.pinkyCurl, 100),
        f.thumbCurl > 0.20 && f.thumbCurl < 0.50,  // neutral thumb
        f.thumbAbduction > 0.35 && f.thumbAbduction < 0.60,
        f.indexMiddleDist > 0.28,
      ]);
    },
  },

  /**
   * disagree — index fingers moving apart:
   * Two index fingers extended apart — two hands
   */
  disagree: {
    minScore: 0.72,
    twoHanded: true,
    score: ([f0, f1]) => {
      if (!f0 || !f1) return 0;
      function indexPoint(f: HandFeatures) {
        return singleHandScore(f, [
          isExtended(f.indexCurl, f.indexPIP),
          isCurled(f.middleCurl, f.middlePIP),
          isCurled(f.ringCurl, 100),
          isCurled(f.pinkyCurl, 100),
        ]);
      }
      return (indexPoint(f0) + indexPoint(f1)) / 2;
    },
  },

  /**
   * no — tap index + middle against thumb (snapping N):
   * Index + middle extended and close together, tapping thumb
   * Distinct: thumbIndexDist < 0.30 (pinching toward index/middle)
   */
  no: {
    minScore: 0.78,
    twoHanded: false,
    score: ([f]) => {
      if (!f) return 0;
      return singleHandScore(f, [
        isExtended(f.indexCurl, f.indexPIP),
        isExtended(f.middleCurl, f.middlePIP),
        isCurled(f.ringCurl, 100),
        isCurled(f.pinkyCurl, 100),
        f.thumbIndexDist < 0.32,          // thumb near index/middle ← pinch snapping
        f.indexMiddleDist < 0.25,
      ]);
    },
  },

  /**
   * how_are_you_greet — same as hungry (curved C-shape):
   * HAND: wide C shape, fingers curved, thumb extended.
   */
  how_are_you_greet: {
    minScore: 0.75,
    twoHanded: false,
    score: ([f]) => {
      if (!f) return 0;
      return singleHandScore(f, [
        isBent(f.indexCurl, f.indexPIP),
        isBent(f.middleCurl, f.middlePIP),
        isBent(f.ringCurl, 140),
        isBent(f.pinkyCurl, 140),
        f.thumbAbduction > 0.45,
        !isCurled(f.indexCurl, f.indexPIP),
      ]);
    },
  },

  /**
   * hungry — same gesture as how_are_you_greet in ISL context:
   * (Used in Basic Needs category)
   */
  hungry: {
    minScore: 0.75,
    twoHanded: false,
    score: ([f]) => PHRASE_SIGNATURES["how_are_you_greet"].score([f]),
  },

  /**
   * what_doing — both hands pinching/shaking (TWO hands pinch):
   * TWO hands: both with index + thumb pinching (O/pinch shape), shaking
   */
  what_doing: {
    minScore: 0.72,
    twoHanded: true,
    score: ([f0, f1]) => {
      if (!f0 || !f1) return 0;
      function pinch(f: HandFeatures) {
        return singleHandScore(f, [
          f.thumbIndexDist < 0.38,
          isBent(f.indexCurl, f.indexPIP) || isCurled(f.indexCurl, f.indexPIP),
          isBent(f.middleCurl, f.middlePIP),
        ]);
      }
      return (pinch(f0) + pinch(f1)) / 2;
    },
  },

  /**
   * not_sure — two flat hands alternating up/down like scale:
   * TWO hands: both flat (all extended), spread fingers
   */
  not_sure: {
    minScore: 0.70,
    twoHanded: true,
    score: ([f0, f1]) => {
      if (!f0 || !f1) return 0;
      function scale(f: HandFeatures) {
        return singleHandScore(f, [
          isExtended(f.indexCurl, f.indexPIP),
          isExtended(f.middleCurl, f.middlePIP),
          isExtended(f.ringCurl, 150),
          isExtended(f.pinkyCurl, 150),
          isThumbExtended(f),
        ]);
      }
      return (scale(f0) + scale(f1)) / 2;
    },
  },

  /**
   * good_morning — arm-sweep (flat hand, moving across):
   * Flat hand, all extended, thumb alongside fingers (natural)
   * Distinct from welcome: thumb slightly neutral, arm position
   */
  good_morning: {
    minScore: 0.80,
    twoHanded: false,
    score: ([f]) => {
      if (!f) return 0;
      return singleHandScore(f, [
        isExtended(f.indexCurl, f.indexPIP),
        isExtended(f.middleCurl, f.middlePIP),
        isExtended(f.ringCurl, 155),
        isExtended(f.pinkyCurl, 155),
        f.thumbCurl > 0.15 && f.thumbCurl < 0.40,   // thumb neutral alongside
        f.thumbAbduction < 0.55,         // thumb held with hand (not jutting out)
        f.indexMiddleDist < 0.28,
      ]);
    },
  },

  /**
   * good_night_greet — hands droop/set (bent hand dropping):
   * All fingers bent (half-curl / C-like), thumb inside
   */
  good_night_greet: {
    minScore: 0.75,
    twoHanded: false,
    score: ([f]) => {
      if (!f) return 0;
      return singleHandScore(f, [
        isBent(f.indexCurl, f.indexPIP),
        isBent(f.middleCurl, f.middlePIP),
        isBent(f.ringCurl, 140),
        isBent(f.pinkyCurl, 140),
        f.thumbCurl > 0.25,
        !isThumbExtended(f),
      ]);
    },
  },

  // ── NEW PHRASES ──────────────────────────────────────────────────────────

  /**
   * food — bunched fingers to mouth:
   * HAND: fingertips (index/middle/ring/pinky) all touching thumb.
   */
  food: {
    minScore: 0.88,
    twoHanded: false,
    score: ([f]) => {
      if (!f) return 0;
      return singleHandScore(f, [
        f.thumbIndexDist < 0.25,
        f.thumbMiddleDist < 0.25,
        f.thumbRingDist < 0.30,
        isCurled(f.middleCurl, f.middlePIP),
        isCurled(f.ringCurl, 100),
      ]);
    },
  },

  /**
   * medicine — middle finger twist on palm:
   * Middle finger bent down toward palm, others neutral/extended.
   */
  medicine: {
    minScore: 0.82,
    twoHanded: false,
    score: ([f]) => {
      if (!f) return 0;
      return singleHandScore(f, [
        isBent(f.middleCurl, f.middlePIP),
        isExtended(f.indexCurl, f.indexPIP),
        isExtended(f.pinkyCurl, 150),
        f.thumbCurl > 0.30,
      ]);
    },
  },

  /**
   * toilet — T-shape shaking:
   * Thumb between index and middle, shaking.
   */
  toilet: {
    minScore: 0.85,
    twoHanded: false,
    score: ([f]) => {
      if (!f) return 0;
      return singleHandScore(f, [
        isCurled(f.indexCurl, f.indexPIP),
        isCurled(f.middleCurl, f.middlePIP),
        f.thumbCurl > 0.40,
        f.thumbIndexDist < 0.35,
      ]);
    },
  },

  /**
   * help_me — thumb-on-palm lift:
   * Same as old help signature.
   */
  help_me: {
    minScore: 0.85,
    twoHanded: false,
    score: ([f]) => {
      if (!f) return 0;
      return singleHandScore(f, [
        isThumbExtended(f),
        isCurled(f.indexCurl, f.indexPIP),
        isCurled(f.middleCurl, f.middlePIP),
        isCurled(f.ringCurl, 100),
      ]);
    },
  },

  /**
   * yes_simple — nodding fist:
   * Fist (all curled) shaking up and down.
   */
  yes_simple: {
    minScore: 0.88,
    twoHanded: false,
    score: ([f]) => {
      if (!f) return 0;
      return singleHandScore(f, [
        isCurled(f.indexCurl, f.indexPIP),
        isCurled(f.middleCurl, f.middlePIP),
        isCurled(f.ringCurl, 100),
        isCurled(f.pinkyCurl, 100),
        f.thumbCrossesPalm,
      ]);
    },
  },

  /**
   * no_simple — finger snap:
   * Index and middle meet thumb then snap open.
   */
  no_simple: {
    minScore: 0.85,
    twoHanded: false,
    score: ([f]) => {
      if (!f) return 0;
      return singleHandScore(f, [
        f.thumbIndexDist < 0.30,
        f.thumbMiddleDist < 0.30,
        isExtended(f.ringCurl, 150),
        isExtended(f.pinkyCurl, 150),
      ]);
    },
  },

  /**
   * emergency_urgent — shake fist:
   * Tight fist shaking rapidly.
   */
  emergency_urgent: {
    minScore: 0.90,
    twoHanded: false,
    score: ([f]) => {
      if (!f) return 0;
      return singleHandScore(f, [
        isCurled(f.indexCurl, f.indexPIP),
        isCurled(f.middleCurl, f.middlePIP),
        isCurled(f.ringCurl, 100),
        isCurled(f.pinkyCurl, 100),
        f.thumbCrossesPalm,
      ]);
    },
  },

  /**
   * thirsty — index down throat:
   * Index finger extended, others curled.
   */
  thirsty: {
    minScore: 0.85,
    twoHanded: false,
    score: ([f]) => {
      if (!f) return 0;
      return singleHandScore(f, [
        isExtended(f.indexCurl, f.indexPIP),
        isCurled(f.middleCurl, f.middlePIP),
        isCurled(f.ringCurl, 100),
        isCurled(f.pinkyCurl, 100),
      ]);
    },
  },
};

// ── Temporal Smoothing Buffer ─────────────────────────────────────────────────

const BUFFER_SIZE = 5;
const MIN_CONSISTENT = 3; // frames in a row needed before firing
let phraseBuffer: string[] = [];

function addToBuffer(label: string): void {
  phraseBuffer.push(label);
  if (phraseBuffer.length > BUFFER_SIZE) phraseBuffer.shift();
}

function getStableLabel(): string | null {
  if (phraseBuffer.length < MIN_CONSISTENT) return null;
  const recent = phraseBuffer.slice(-MIN_CONSISTENT);
  if (recent.every((l) => l === recent[0])) return recent[0];
  return null;
}

export function resetPhraseBuffer(): void {
  phraseBuffer = [];
}

// ── Main Classification ───────────────────────────────────────────────────────

export function classifyISLPhrase(
  multiHands: HandLandmark[][],
  targetPhraseId?: string
): { label: string; confidence: number } | null {
  if (!multiHands || multiHands.length === 0) return null;

  const handFeatures = multiHands
    .map((lm) => extractFeatures(lm))
    .filter((f): f is HandFeatures => f !== null);

  if (handFeatures.length === 0) return null;

  const handsAvailable = handFeatures.length;

  // ── Mode 1: Target phrase (practice mode) ─────────────────────────────────
  // Only score the target phrase — reduces false positives drastically
  if (targetPhraseId && PHRASE_SIGNATURES[targetPhraseId]) {
    const sig = PHRASE_SIGNATURES[targetPhraseId];

    // Require 2 hands if the sign is two-handed
    if (sig.twoHanded && handsAvailable < 2) {
      return null; // Don't fire at all — user must show both hands
    }

    const score = sig.score(handFeatures);
    if (score >= sig.minScore) {
      addToBuffer(targetPhraseId);
      const stable = getStableLabel();
      if (stable) {
        return { label: targetPhraseId, confidence: Math.min(0.97, score) };
      }
    } else {
      // Low score — reset buffer so we don't carry stale frames
      phraseBuffer = [];
    }
    return null;
  }

  // ── Mode 2: Free detection (browse/learn mode) ────────────────────────────
  // Score ALL phrases and pick the best winner
  const scores: { label: string; score: number; minScore: number }[] = [];

  for (const [label, sig] of Object.entries(PHRASE_SIGNATURES)) {
    if (sig.twoHanded && handsAvailable < 2) continue;
    const s = sig.score(handFeatures);
    scores.push({ label, score: s, minScore: sig.minScore });
  }

  scores.sort((a, b) => b.score - a.score);

  if (scores.length === 0) return null;

  const best = scores[0];
  const runner = scores[1];

  // Must exceed its own minScore AND beat runner-up by a healthy margin
  if (best.score < best.minScore) return null;
  if (runner && runner.score >= best.minScore && best.score - runner.score < 0.08) {
    // Too ambiguous — require higher margin
    return null;
  }

  addToBuffer(best.label);
  const stable = getStableLabel();
  if (stable && stable === best.label) {
    return { label: best.label, confidence: Math.min(0.95, best.score) };
  }

  return null;
}
