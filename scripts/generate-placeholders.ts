import fs from "fs";
import path from "path";

/**
 * Generates hand gesture illustration SVGs for all ISL signs.
 * Each SVG shows a stylized hand with correct finger positions,
 * movement arrows, and brief instruction text.
 *
 * Run with: npx tsx scripts/generate-placeholders.ts
 */

const PUBLIC_DIR = path.join(process.cwd(), "public", "signs");

// ── Types ──────────────────────────────────────────────────────────

type FingerState = "up" | "down" | "bent";
type ThumbState = "out" | "tucked" | "up" | "across";
type Movement =
  | "none"
  | "shake"
  | "circle"
  | "wave"
  | "forward"
  | "arc"
  | "down-tap"
  | "twist";

interface HandShape {
  thumb: ThumbState;
  index: FingerState;
  middle: FingerState;
  ring: FingerState;
  pinky: FingerState;
  instruction: string;
  movement?: Movement;
}

// ── SVG Drawing Constants ──────────────────────────────────────────

const SKIN = "#F5D0C5";
const OUTLINE = "#5D4037";
const SW = 2;
const ARROW = "#FFCA28";

// Palm geometry
const PCX = 150,
  PCY = 188,
  PRX = 46,
  PRY = 40;

// Finger configs: base-x, base-y, angle, max-length, width
const FCONF = {
  index: { bx: 121, by: 155, a: -7, l: 70, w: 19 },
  middle: { bx: 144, by: 150, a: 0, l: 76, w: 19 },
  ring: { bx: 167, by: 153, a: 7, l: 68, w: 18 },
  pinky: { bx: 187, by: 162, a: 14, l: 55, w: 16 },
};

// ── Utility Helpers ────────────────────────────────────────────────

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapText(text: string, max: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (cur && (cur + " " + w).length > max) {
      lines.push(cur);
      cur = w;
    } else {
      cur = cur ? cur + " " + w : w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// ── SVG Drawing Functions ──────────────────────────────────────────

function drawFinger(name: keyof typeof FCONF, state: FingerState): string {
  const f = FCONF[name];

  if (state === "down") {
    // Small knuckle bump to indicate folded finger
    const r = Math.round(f.w / 2) - 2;
    return `<rect x="${f.bx - f.w / 2 + 2}" y="${f.by - 10}" width="${f.w - 4}" height="12" rx="${r}" fill="${SKIN}" stroke="${OUTLINE}" stroke-width="1.5" transform="rotate(${f.a},${f.bx},${f.by})"/>`;
  }

  const len = state === "bent" ? Math.round(f.l * 0.42) : f.l;
  const r = Math.round(f.w / 2);

  let svg = `<rect x="${f.bx - f.w / 2}" y="${f.by - len}" width="${f.w}" height="${len}" rx="${r}" fill="${SKIN}" stroke="${OUTLINE}" stroke-width="${SW}" transform="rotate(${f.a},${f.bx},${f.by})"/>`;

  if (state === "bent") {
    // Knuckle circle to show the bend
    const rad = f.a * (Math.PI / 180);
    const kx = f.bx - Math.sin(rad) * (len - 2);
    const ky = f.by - Math.cos(rad) * (len - 2);
    svg += `<circle cx="${kx}" cy="${ky}" r="${r + 2}" fill="${SKIN}" stroke="${OUTLINE}" stroke-width="1.5"/>`;
  }

  return svg;
}

function drawThumb(state: ThumbState): string {
  const w = 19,
    r = Math.round(w / 2);

  switch (state) {
    case "out":
      return `<rect x="${PCX - PRX - 36}" y="${PCY - 14}" width="42" height="${w}" rx="${r}" fill="${SKIN}" stroke="${OUTLINE}" stroke-width="${SW}" transform="rotate(-22,${PCX - PRX},${PCY})"/>`;
    case "up":
      return `<rect x="${PCX - PRX - 6}" y="${PCY - 54}" width="${w}" height="46" rx="${r}" fill="${SKIN}" stroke="${OUTLINE}" stroke-width="${SW}" transform="rotate(-28,${PCX - PRX},${PCY})"/>`;
    case "across":
      return `<rect x="${PCX - 24}" y="${PCY + 12}" width="44" height="${w - 2}" rx="${r - 1}" fill="${SKIN}" stroke="${OUTLINE}" stroke-width="${SW}"/>`;
    case "tucked":
      return `<rect x="${PCX - PRX - 4}" y="${PCY - 4}" width="18" height="${w - 2}" rx="${r - 1}" fill="${SKIN}" stroke="${OUTLINE}" stroke-width="1.5" transform="rotate(-18,${PCX - PRX},${PCY})"/>`;
  }
}

function drawMovement(m: Movement): string {
  if (!m || m === "none") return "";
  const c = ARROW;
  const sw = 2.5;

  switch (m) {
    case "shake":
      return [
        `<line x1="68" y1="130" x2="48" y2="130" stroke="${c}" stroke-width="${sw}" stroke-linecap="round"/>`,
        `<polygon points="52,126 44,130 52,134" fill="${c}"/>`,
        `<line x1="232" y1="130" x2="252" y2="130" stroke="${c}" stroke-width="${sw}" stroke-linecap="round"/>`,
        `<polygon points="248,126 256,130 248,134" fill="${c}"/>`,
      ].join("");
    case "circle":
      return [
        `<path d="M232,155 A32,32 0 1,1 234,150" stroke="${c}" stroke-width="${sw}" fill="none" stroke-dasharray="5 4"/>`,
        `<polygon points="230,148 238,150 232,157" fill="${c}"/>`,
      ].join("");
    case "wave":
      return [
        `<path d="M70,108 Q90,85 110,108 Q130,131 150,108" stroke="${c}" stroke-width="${sw}" fill="none"/>`,
        `<polygon points="146,104 154,108 148,114" fill="${c}"/>`,
      ].join("");
    case "forward":
      return [
        `<line x1="150" y1="118" x2="150" y2="88" stroke="${c}" stroke-width="${sw}" stroke-linecap="round"/>`,
        `<polygon points="144,92 150,78 156,92" fill="${c}"/>`,
      ].join("");
    case "arc":
      return [
        `<path d="M112,108 Q150,68 188,108" stroke="${c}" stroke-width="${sw}" fill="none"/>`,
        `<polygon points="184,104 192,108 186,114" fill="${c}"/>`,
      ].join("");
    case "down-tap":
      return [
        `<line x1="150" y1="232" x2="150" y2="252" stroke="${c}" stroke-width="${sw}" stroke-linecap="round"/>`,
        `<polygon points="144,248 150,260 156,248" fill="${c}"/>`,
        `<line x1="145" y1="260" x2="155" y2="260" stroke="${c}" stroke-width="1.5" stroke-linecap="round"/>`,
      ].join("");
    case "twist":
      return [
        `<path d="M224,168 A16,16 0 1,1 226,163" stroke="${c}" stroke-width="${sw}" fill="none"/>`,
        `<polygon points="222,161 230,163 225,170" fill="${c}"/>`,
      ].join("");
    default:
      return "";
  }
}

function createGestureSVG(
  label: string,
  bgColor: string,
  hand: HandShape
): string {
  const handParts = [
    // Palm (drawn first as background)
    `<ellipse cx="${PCX}" cy="${PCY}" rx="${PRX}" ry="${PRY}" fill="${SKIN}" stroke="${OUTLINE}" stroke-width="${SW}"/>`,
    // Wrist
    `<rect x="${PCX - 22}" y="${PCY + PRY - 6}" width="44" height="28" rx="8" fill="${SKIN}" stroke="${OUTLINE}" stroke-width="1.5"/>`,
    // Fingers (drawn on top of palm)
    drawFinger("index", hand.index),
    drawFinger("middle", hand.middle),
    drawFinger("ring", hand.ring),
    drawFinger("pinky", hand.pinky),
    // Thumb (drawn last, on top of everything)
    drawThumb(hand.thumb),
  ]
    .filter(Boolean)
    .join("\n    ");

  const mvmt = drawMovement(hand.movement ?? "none");

  const instrLines = wrapText(hand.instruction, 36);
  const instrY = 264;
  const instrSVG = instrLines
    .map(
      (l, i) =>
        `<text x="150" y="${instrY + i * 15}" font-family="system-ui,sans-serif" font-size="12" fill="#fff" opacity="0.9" text-anchor="middle">${escapeXml(l)}</text>`
    )
    .join("\n  ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
  <rect width="300" height="300" rx="16" fill="${bgColor}"/>
  <text x="150" y="28" font-family="system-ui,sans-serif" font-size="20" font-weight="bold" fill="#fff" text-anchor="middle" dominant-baseline="central">${escapeXml(label)}</text>
  <text x="150" y="48" font-family="system-ui,sans-serif" font-size="11" fill="#fff" opacity="0.6" text-anchor="middle">ISL Hand Sign</text>
  <g>
    ${handParts}
  </g>
  ${mvmt}
  ${instrSVG}
</svg>`;
}

// ── Sign Definitions ───────────────────────────────────────────────

const ALPHABET: Record<string, HandShape> = {
  a: {
    thumb: "out",
    index: "down",
    middle: "down",
    ring: "down",
    pinky: "down",
    instruction: "Fist with thumb to the side",
  },
  b: {
    thumb: "tucked",
    index: "up",
    middle: "up",
    ring: "up",
    pinky: "up",
    instruction: "Flat hand, all fingers together",
  },
  c: {
    thumb: "out",
    index: "bent",
    middle: "bent",
    ring: "bent",
    pinky: "bent",
    instruction: "Curved hand forming C shape",
  },
  d: {
    thumb: "across",
    index: "up",
    middle: "down",
    ring: "down",
    pinky: "down",
    instruction: "Index up, others touch thumb",
  },
  e: {
    thumb: "tucked",
    index: "bent",
    middle: "bent",
    ring: "bent",
    pinky: "bent",
    instruction: "All fingers curled down",
  },
  f: {
    thumb: "across",
    index: "bent",
    middle: "up",
    ring: "up",
    pinky: "up",
    instruction: "Thumb & index circle, others up",
  },
  g: {
    thumb: "up",
    index: "up",
    middle: "down",
    ring: "down",
    pinky: "down",
    instruction: "Index points out, thumb up",
  },
  h: {
    thumb: "tucked",
    index: "up",
    middle: "up",
    ring: "down",
    pinky: "down",
    instruction: "Index & middle point sideways",
  },
  i: {
    thumb: "tucked",
    index: "down",
    middle: "down",
    ring: "down",
    pinky: "up",
    instruction: "Pinky up, others closed",
  },
  j: {
    thumb: "tucked",
    index: "down",
    middle: "down",
    ring: "down",
    pinky: "up",
    instruction: "Pinky up, trace J shape",
    movement: "arc",
  },
  k: {
    thumb: "up",
    index: "up",
    middle: "up",
    ring: "down",
    pinky: "down",
    instruction: "Index & middle up, thumb between",
  },
  l: {
    thumb: "out",
    index: "up",
    middle: "down",
    ring: "down",
    pinky: "down",
    instruction: "L-shape: index up, thumb out",
  },
  m: {
    thumb: "tucked",
    index: "bent",
    middle: "bent",
    ring: "bent",
    pinky: "down",
    instruction: "Three fingers fold over thumb",
  },
  n: {
    thumb: "tucked",
    index: "bent",
    middle: "bent",
    ring: "down",
    pinky: "down",
    instruction: "Two fingers fold over thumb",
  },
  o: {
    thumb: "across",
    index: "bent",
    middle: "bent",
    ring: "bent",
    pinky: "bent",
    instruction: "Fingertips touch thumb, O shape",
  },
  p: {
    thumb: "up",
    index: "up",
    middle: "up",
    ring: "down",
    pinky: "down",
    instruction: "Like K hand pointing down",
  },
  q: {
    thumb: "out",
    index: "up",
    middle: "down",
    ring: "down",
    pinky: "down",
    instruction: "Thumb & index point downward",
  },
  r: {
    thumb: "tucked",
    index: "up",
    middle: "up",
    ring: "down",
    pinky: "down",
    instruction: "Index & middle crossed",
  },
  s: {
    thumb: "across",
    index: "down",
    middle: "down",
    ring: "down",
    pinky: "down",
    instruction: "Fist with thumb across fingers",
  },
  t: {
    thumb: "tucked",
    index: "down",
    middle: "down",
    ring: "down",
    pinky: "down",
    instruction: "Thumb between index & middle",
  },
  u: {
    thumb: "tucked",
    index: "up",
    middle: "up",
    ring: "down",
    pinky: "down",
    instruction: "Index & middle together, up",
  },
  v: {
    thumb: "tucked",
    index: "up",
    middle: "up",
    ring: "down",
    pinky: "down",
    instruction: "Index & middle spread (V)",
  },
  w: {
    thumb: "tucked",
    index: "up",
    middle: "up",
    ring: "up",
    pinky: "down",
    instruction: "Index, middle, ring spread (W)",
  },
  x: {
    thumb: "tucked",
    index: "bent",
    middle: "down",
    ring: "down",
    pinky: "down",
    instruction: "Index finger hooked/crooked",
  },
  y: {
    thumb: "out",
    index: "down",
    middle: "down",
    ring: "down",
    pinky: "up",
    instruction: "Thumb & pinky out (Y shape)",
  },
  z: {
    thumb: "tucked",
    index: "up",
    middle: "down",
    ring: "down",
    pinky: "down",
    instruction: "Index traces Z in air",
    movement: "wave",
  },
};

const NUMBERS: Record<string, HandShape> = {
  "0": {
    thumb: "across",
    index: "bent",
    middle: "bent",
    ring: "bent",
    pinky: "bent",
    instruction: "All fingertips touch thumb (O)",
  },
  "1": {
    thumb: "tucked",
    index: "up",
    middle: "down",
    ring: "down",
    pinky: "down",
    instruction: "Index finger up",
  },
  "2": {
    thumb: "tucked",
    index: "up",
    middle: "up",
    ring: "down",
    pinky: "down",
    instruction: "Index & middle up",
  },
  "3": {
    thumb: "out",
    index: "up",
    middle: "up",
    ring: "down",
    pinky: "down",
    instruction: "Thumb, index & middle extended",
  },
  "4": {
    thumb: "tucked",
    index: "up",
    middle: "up",
    ring: "up",
    pinky: "up",
    instruction: "Four fingers up, thumb tucked",
  },
  "5": {
    thumb: "out",
    index: "up",
    middle: "up",
    ring: "up",
    pinky: "up",
    instruction: "All five fingers spread open",
  },
  "6": {
    thumb: "out",
    index: "down",
    middle: "down",
    ring: "down",
    pinky: "up",
    instruction: "Thumb & pinky out, others closed",
  },
  "7": {
    thumb: "out",
    index: "down",
    middle: "down",
    ring: "up",
    pinky: "down",
    instruction: "Thumb & ring finger extended",
  },
  "8": {
    thumb: "out",
    index: "down",
    middle: "up",
    ring: "down",
    pinky: "down",
    instruction: "Thumb & middle finger extended",
  },
  "9": {
    thumb: "out",
    index: "up",
    middle: "down",
    ring: "down",
    pinky: "down",
    instruction: "Thumb & index touch, form circle",
  },
};

const GREETINGS: Record<string, HandShape> = {
  hello: {
    thumb: "out",
    index: "up",
    middle: "up",
    ring: "up",
    pinky: "up",
    instruction: "Open palm, wave side to side",
    movement: "shake",
  },
  goodbye: {
    thumb: "out",
    index: "up",
    middle: "up",
    ring: "up",
    pinky: "up",
    instruction: "Open palm, wave goodbye",
    movement: "wave",
  },
  "thank-you": {
    thumb: "tucked",
    index: "up",
    middle: "up",
    ring: "up",
    pinky: "up",
    instruction: "Flat hand from chin forward",
    movement: "forward",
  },
  sorry: {
    thumb: "across",
    index: "down",
    middle: "down",
    ring: "down",
    pinky: "down",
    instruction: "Fist circles on chest",
    movement: "circle",
  },
  please: {
    thumb: "out",
    index: "up",
    middle: "up",
    ring: "up",
    pinky: "up",
    instruction: "Open palm circles on chest",
    movement: "circle",
  },
  "good-morning": {
    thumb: "out",
    index: "up",
    middle: "up",
    ring: "up",
    pinky: "up",
    instruction: "Rising hand like sun",
    movement: "arc",
  },
  "good-night": {
    thumb: "tucked",
    index: "bent",
    middle: "bent",
    ring: "bent",
    pinky: "bent",
    instruction: "Hand closes moving downward",
    movement: "down-tap",
  },
  "how-are-you": {
    thumb: "out",
    index: "up",
    middle: "down",
    ring: "down",
    pinky: "down",
    instruction: "Point forward with question face",
    movement: "forward",
  },
  "i-am-fine": {
    thumb: "out",
    index: "up",
    middle: "up",
    ring: "up",
    pinky: "up",
    instruction: "Thumb up, then flat hand out",
    movement: "forward",
  },
  "nice-to-meet-you": {
    thumb: "out",
    index: "up",
    middle: "up",
    ring: "up",
    pinky: "up",
    instruction: "Open hands come together",
    movement: "forward",
  },
  welcome: {
    thumb: "out",
    index: "up",
    middle: "up",
    ring: "up",
    pinky: "up",
    instruction: "Open arm gesture inward",
    movement: "arc",
  },
  congratulations: {
    thumb: "out",
    index: "up",
    middle: "up",
    ring: "up",
    pinky: "up",
    instruction: "Clapping hands motion",
    movement: "shake",
  },
};

const PHRASES: Record<string, HandShape> = {
  yes: {
    thumb: "across",
    index: "down",
    middle: "down",
    ring: "down",
    pinky: "down",
    instruction: "Fist nods forward",
    movement: "down-tap",
  },
  no: {
    thumb: "out",
    index: "up",
    middle: "up",
    ring: "down",
    pinky: "down",
    instruction: "Index & middle snap to thumb",
    movement: "down-tap",
  },
  help: {
    thumb: "out",
    index: "down",
    middle: "down",
    ring: "down",
    pinky: "down",
    instruction: "Fist on open palm, lift up",
    movement: "forward",
  },
  water: {
    thumb: "out",
    index: "up",
    middle: "up",
    ring: "up",
    pinky: "down",
    instruction: "W-hand taps chin",
    movement: "down-tap",
  },
  food: {
    thumb: "across",
    index: "bent",
    middle: "bent",
    ring: "bent",
    pinky: "bent",
    instruction: "Bunched fingers to mouth",
    movement: "down-tap",
  },
  home: {
    thumb: "across",
    index: "bent",
    middle: "bent",
    ring: "bent",
    pinky: "bent",
    instruction: "Fingers touch cheek then jaw",
    movement: "down-tap",
  },
  school: {
    thumb: "out",
    index: "up",
    middle: "up",
    ring: "up",
    pinky: "up",
    instruction: "Clap hands twice",
    movement: "shake",
  },
  friend: {
    thumb: "out",
    index: "up",
    middle: "down",
    ring: "down",
    pinky: "down",
    instruction: "Hook index fingers together",
    movement: "shake",
  },
  love: {
    thumb: "out",
    index: "up",
    middle: "down",
    ring: "down",
    pinky: "up",
    instruction: "I-L-Y handshape (thumb, index, pinky)",
  },
  learn: {
    thumb: "out",
    index: "up",
    middle: "up",
    ring: "up",
    pinky: "up",
    instruction: "Grab from palm to head",
    movement: "forward",
  },
  understand: {
    thumb: "out",
    index: "up",
    middle: "down",
    ring: "down",
    pinky: "down",
    instruction: "Index flicks up near temple",
    movement: "forward",
  },
  "don't-understand": {
    thumb: "out",
    index: "up",
    middle: "down",
    ring: "down",
    pinky: "down",
    instruction: "Index shakes near temple",
    movement: "shake",
  },
  name: {
    thumb: "tucked",
    index: "up",
    middle: "up",
    ring: "down",
    pinky: "down",
    instruction: "Two fingers tap other hand",
    movement: "down-tap",
  },
  what: {
    thumb: "out",
    index: "up",
    middle: "up",
    ring: "up",
    pinky: "up",
    instruction: "Open palms up, shake",
    movement: "shake",
  },
  where: {
    thumb: "tucked",
    index: "up",
    middle: "down",
    ring: "down",
    pinky: "down",
    instruction: "Index points & waves",
    movement: "shake",
  },
  when: {
    thumb: "tucked",
    index: "up",
    middle: "down",
    ring: "down",
    pinky: "down",
    instruction: "Index circles then points",
    movement: "circle",
  },
  why: {
    thumb: "out",
    index: "up",
    middle: "up",
    ring: "up",
    pinky: "up",
    instruction: "Touch forehead, hand to Y",
    movement: "forward",
  },
  "how-much": {
    thumb: "out",
    index: "bent",
    middle: "bent",
    ring: "bent",
    pinky: "bent",
    instruction: "Curved hands open outward",
    movement: "shake",
  },
  stop: {
    thumb: "out",
    index: "up",
    middle: "up",
    ring: "up",
    pinky: "up",
    instruction: "Flat hand chops other palm",
    movement: "down-tap",
  },
  come: {
    thumb: "tucked",
    index: "up",
    middle: "down",
    ring: "down",
    pinky: "down",
    instruction: "Index beckons toward you",
    movement: "arc",
  },
};

const FAMILY: Record<string, HandShape> = {
  mother: {
    thumb: "out",
    index: "up",
    middle: "up",
    ring: "up",
    pinky: "up",
    instruction: "Open hand taps chin twice",
    movement: "down-tap",
  },
  father: {
    thumb: "out",
    index: "up",
    middle: "up",
    ring: "up",
    pinky: "up",
    instruction: "Open hand taps forehead twice",
    movement: "down-tap",
  },
  brother: {
    thumb: "out",
    index: "up",
    middle: "down",
    ring: "down",
    pinky: "down",
    instruction: "Boy sign + same sign",
    movement: "forward",
  },
  sister: {
    thumb: "out",
    index: "up",
    middle: "down",
    ring: "down",
    pinky: "down",
    instruction: "Girl sign + same sign",
    movement: "forward",
  },
  grandfather: {
    thumb: "out",
    index: "up",
    middle: "up",
    ring: "up",
    pinky: "up",
    instruction: "Father sign + arc forward",
    movement: "arc",
  },
  grandmother: {
    thumb: "out",
    index: "up",
    middle: "up",
    ring: "up",
    pinky: "up",
    instruction: "Mother sign + arc forward",
    movement: "arc",
  },
  son: {
    thumb: "out",
    index: "up",
    middle: "up",
    ring: "up",
    pinky: "up",
    instruction: "Baby cradle + boy sign",
    movement: "down-tap",
  },
  daughter: {
    thumb: "out",
    index: "up",
    middle: "up",
    ring: "up",
    pinky: "up",
    instruction: "Baby cradle + girl sign",
    movement: "down-tap",
  },
  husband: {
    thumb: "across",
    index: "down",
    middle: "down",
    ring: "down",
    pinky: "down",
    instruction: "Clasp hands + man marker",
    movement: "forward",
  },
  wife: {
    thumb: "across",
    index: "down",
    middle: "down",
    ring: "down",
    pinky: "down",
    instruction: "Clasp hands + woman marker",
    movement: "forward",
  },
  baby: {
    thumb: "out",
    index: "up",
    middle: "up",
    ring: "up",
    pinky: "up",
    instruction: "Arms cradle, rock side to side",
    movement: "shake",
  },
  family: {
    thumb: "out",
    index: "up",
    middle: "up",
    ring: "up",
    pinky: "up",
    instruction: "Both hands circle together",
    movement: "circle",
  },
};

const COLORS_SIGNS: Record<string, HandShape> = {
  red: {
    thumb: "tucked",
    index: "up",
    middle: "down",
    ring: "down",
    pinky: "down",
    instruction: "Index touches lip, pulls down",
    movement: "down-tap",
  },
  blue: {
    thumb: "out",
    index: "up",
    middle: "up",
    ring: "up",
    pinky: "up",
    instruction: "B-hand shakes at side",
    movement: "shake",
  },
  green: {
    thumb: "tucked",
    index: "up",
    middle: "up",
    ring: "down",
    pinky: "down",
    instruction: "G-hand twists at wrist",
    movement: "twist",
  },
  yellow: {
    thumb: "out",
    index: "down",
    middle: "down",
    ring: "down",
    pinky: "up",
    instruction: "Y-hand shakes at side",
    movement: "shake",
  },
  white: {
    thumb: "out",
    index: "up",
    middle: "up",
    ring: "up",
    pinky: "up",
    instruction: "Open hand pulls from chest",
    movement: "forward",
  },
  black: {
    thumb: "tucked",
    index: "up",
    middle: "down",
    ring: "down",
    pinky: "down",
    instruction: "Index draws across forehead",
    movement: "shake",
  },
  orange: {
    thumb: "across",
    index: "down",
    middle: "down",
    ring: "down",
    pinky: "down",
    instruction: "Squeeze fist near chin",
    movement: "down-tap",
  },
  pink: {
    thumb: "tucked",
    index: "up",
    middle: "up",
    ring: "down",
    pinky: "down",
    instruction: "P-hand brushes chin downward",
    movement: "down-tap",
  },
};

const DAYS: Record<string, HandShape> = {
  monday: {
    thumb: "out",
    index: "down",
    middle: "down",
    ring: "down",
    pinky: "down",
    instruction: "M-hand circles slightly",
    movement: "circle",
  },
  tuesday: {
    thumb: "tucked",
    index: "up",
    middle: "down",
    ring: "down",
    pinky: "down",
    instruction: "T-hand twists at wrist",
    movement: "twist",
  },
  wednesday: {
    thumb: "out",
    index: "up",
    middle: "up",
    ring: "up",
    pinky: "down",
    instruction: "W-hand moves in circle",
    movement: "circle",
  },
  thursday: {
    thumb: "tucked",
    index: "up",
    middle: "up",
    ring: "down",
    pinky: "down",
    instruction: "H-hand shakes slightly",
    movement: "shake",
  },
  friday: {
    thumb: "across",
    index: "bent",
    middle: "up",
    ring: "up",
    pinky: "up",
    instruction: "F-hand twists at wrist",
    movement: "twist",
  },
  saturday: {
    thumb: "across",
    index: "down",
    middle: "down",
    ring: "down",
    pinky: "down",
    instruction: "S-fist circles",
    movement: "circle",
  },
  sunday: {
    thumb: "out",
    index: "up",
    middle: "up",
    ring: "up",
    pinky: "up",
    instruction: "Both palms push outward",
    movement: "forward",
  },
  today: {
    thumb: "out",
    index: "bent",
    middle: "bent",
    ring: "down",
    pinky: "down",
    instruction: "Both Y-hands drop down",
    movement: "down-tap",
  },
  tomorrow: {
    thumb: "out",
    index: "up",
    middle: "down",
    ring: "down",
    pinky: "down",
    instruction: "Thumb on cheek, flick forward",
    movement: "forward",
  },
  yesterday: {
    thumb: "out",
    index: "up",
    middle: "down",
    ring: "down",
    pinky: "down",
    instruction: "Thumb touches cheek, arc back",
    movement: "arc",
  },
};

const EMERGENCY: Record<string, HandShape> = {
  "help-me": {
    thumb: "out",
    index: "down",
    middle: "down",
    ring: "down",
    pinky: "down",
    instruction: "Fist on palm, push up urgently",
    movement: "forward",
  },
  danger: {
    thumb: "across",
    index: "down",
    middle: "down",
    ring: "down",
    pinky: "down",
    instruction: "Fist rises past other fist",
    movement: "forward",
  },
  "call-police": {
    thumb: "out",
    index: "up",
    middle: "up",
    ring: "up",
    pinky: "up",
    instruction: "C-hand near ear, then point",
    movement: "forward",
  },
  hospital: {
    thumb: "tucked",
    index: "up",
    middle: "up",
    ring: "down",
    pinky: "down",
    instruction: "H-hand draws cross on arm",
    movement: "down-tap",
  },
  pain: {
    thumb: "tucked",
    index: "up",
    middle: "down",
    ring: "down",
    pinky: "down",
    instruction: "Index fingers point & twist",
    movement: "twist",
  },
  fire: {
    thumb: "out",
    index: "up",
    middle: "up",
    ring: "up",
    pinky: "up",
    instruction: "Wiggling fingers rise upward",
    movement: "wave",
  },
  medicine: {
    thumb: "tucked",
    index: "up",
    middle: "up",
    ring: "down",
    pinky: "down",
    instruction: "Middle finger circles on palm",
    movement: "circle",
  },
  emergency: {
    thumb: "out",
    index: "up",
    middle: "down",
    ring: "down",
    pinky: "down",
    instruction: "E-hand shakes urgently",
    movement: "shake",
  },
};

// ── Main ───────────────────────────────────────────────────────────

function writeGesture(
  dir: string,
  filename: string,
  label: string,
  bgColor: string,
  hand: HandShape
) {
  const svg = createGestureSVG(label, bgColor, hand);
  fs.writeFileSync(path.join(dir, `${filename}.svg`), svg);
}

function main() {
  console.log("Generating hand gesture illustration SVGs...\n");

  // Alphabet (A-Z)
  const alphabetDir = path.join(PUBLIC_DIR, "alphabet");
  ensureDir(alphabetDir);
  for (const [letter, hand] of Object.entries(ALPHABET)) {
    writeGesture(alphabetDir, letter, letter.toUpperCase(), "#3b82f6", hand);
  }
  console.log("  Alphabet: 26 signs (a-z)");

  // Numbers (0-9)
  const numbersDir = path.join(PUBLIC_DIR, "numbers");
  ensureDir(numbersDir);
  for (const [num, hand] of Object.entries(NUMBERS)) {
    writeGesture(numbersDir, num, num, "#8b5cf6", hand);
  }
  console.log("  Numbers: 10 signs (0-9)");

  // Greetings
  const greetingsDir = path.join(PUBLIC_DIR, "greetings");
  ensureDir(greetingsDir);
  for (const [name, hand] of Object.entries(GREETINGS)) {
    const label = name
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    writeGesture(greetingsDir, name, label, "#10b981", hand);
  }
  console.log(`  Greetings: ${Object.keys(GREETINGS).length} signs`);

  // Phrases, Family, Colors, Days, Emergency → all in /phrases/
  const phrasesDir = path.join(PUBLIC_DIR, "phrases");
  ensureDir(phrasesDir);

  for (const [name, hand] of Object.entries(PHRASES)) {
    const label = name
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    writeGesture(phrasesDir, name, label, "#f59e0b", hand);
  }
  console.log(`  Phrases: ${Object.keys(PHRASES).length} signs`);

  for (const [name, hand] of Object.entries(FAMILY)) {
    const label = name
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    writeGesture(phrasesDir, name, label, "#ec4899", hand);
  }
  console.log(`  Family: ${Object.keys(FAMILY).length} signs`);

  for (const [name, hand] of Object.entries(COLORS_SIGNS)) {
    const label = name.replace(/\b\w/g, (c) => c.toUpperCase());
    writeGesture(phrasesDir, name, label, "#ef4444", hand);
  }
  console.log(`  Colors: ${Object.keys(COLORS_SIGNS).length} signs`);

  for (const [name, hand] of Object.entries(DAYS)) {
    const label = name.replace(/\b\w/g, (c) => c.toUpperCase());
    writeGesture(phrasesDir, name, label, "#06b6d4", hand);
  }
  console.log(`  Days: ${Object.keys(DAYS).length} signs`);

  for (const [name, hand] of Object.entries(EMERGENCY)) {
    const label = name
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    writeGesture(phrasesDir, name, label, "#dc2626", hand);
  }
  console.log(`  Emergency: ${Object.keys(EMERGENCY).length} signs`);

  const total =
    26 +
    10 +
    Object.keys(GREETINGS).length +
    Object.keys(PHRASES).length +
    Object.keys(FAMILY).length +
    Object.keys(COLORS_SIGNS).length +
    Object.keys(DAYS).length +
    Object.keys(EMERGENCY).length;
  console.log(`\nDone! Generated ${total} hand gesture SVGs`);
}

main();
