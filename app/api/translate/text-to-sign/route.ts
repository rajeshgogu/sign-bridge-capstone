import { db } from "@/lib/db";
import { signs } from "@/lib/db/schema";
import { eq, ilike, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { textToSignSchema } from "@/lib/validators/translate";
import { PHRASES } from "@/lib/data/phrases";

/** Normalise: lowercase, remove punctuation, collapse whitespace */
function normalise(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Convert a PhraseData to the TranslationSign shape the store expects */
function phraseToSign(phrase: (typeof PHRASES)[number]) {
  return {
    id: phrase.id,
    name: phrase.label,
    imageUrl: phrase.imageUrl ?? null,
    gifUrl: phrase.videoUrl ?? null,
    instructions: phrase.instructions,
    isPhrase: true,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = textToSignSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { text } = parsed.data;
    const normText = normalise(text);

    // ── Pre-process: Build phrase map dynamically to ensure latest data ─────
    const phraseMap = new Map<string, (typeof PHRASES)[number]>();
    [...PHRASES]
      .sort((a, b) => b.label.length - a.label.length)
      .forEach((p) => {
        phraseMap.set(normalise(p.label), p);
      });

    // ── Phase 1: Try exact match for the entire string ──────────────────────
    if (phraseMap.has(normText)) {
      return NextResponse.json({
        signs: [phraseToSign(phraseMap.get(normText)!)],
        text,
      });
    }

    // ── Phase 2: Greedy longest-match-first matching ────────────────────────
    const matchedSigns: any[] = [];
    const words = normText.split(/\s+/).filter(Boolean);
    let i = 0;

    while (i < words.length) {
      let matched = false;

      // Try window sizes from longest down to 1
      for (let len = words.length - i; len >= 1; len--) {
        const candidate = words.slice(i, i + len).join(" ");
        const phrase = phraseMap.get(candidate);
        if (phrase) {
          matchedSigns.push(phraseToSign(phrase));
          i += len;
          matched = true;
          break;
        }
      }

      if (!matched) {
        const word = words[i];

        // Try DB lookup for single word
        const [dbMatch] = await db
          .select()
          .from(signs)
          .where(
            or(
              ilike(signs.englishText, word),
              ilike(signs.name, word),
              ilike(signs.hindiText, word)
            )
          )
          .limit(1);

        if (dbMatch) {
          matchedSigns.push({
            id: dbMatch.id,
            name: dbMatch.name,
            imageUrl: dbMatch.imageUrl,
            gifUrl: dbMatch.gifUrl,
          });
        } else {
          // Fallback to fingerspelling
          for (const char of word.toUpperCase()) {
            if (/[A-Z]/.test(char)) {
              const [letterSign] = await db
                .select()
                .from(signs)
                .where(eq(signs.slug, `isl-alphabet-${char.toLowerCase()}`))
                .limit(1);
              if (letterSign) matchedSigns.push(letterSign);
            } else if (/[0-9]/.test(char)) {
              const [numSign] = await db
                .select()
                .from(signs)
                .where(eq(signs.slug, `isl-number-${char}`))
                .limit(1);
              if (numSign) matchedSigns.push(numSign);
            }
          }
        }
        i++;
      }
    }

    return NextResponse.json({ signs: matchedSigns, text });
  } catch (error) {
    console.error("Translation error:", error);
    return NextResponse.json(
      { error: "Translation failed" },
      { status: 500 }
    );
  }
}

