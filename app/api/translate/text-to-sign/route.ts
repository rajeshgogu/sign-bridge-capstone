import { db } from "@/lib/db";
import { signs } from "@/lib/db/schema";
import { eq, ilike, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { textToSignSchema } from "@/lib/validators/translate";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = textToSignSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }

    const { text } = parsed.data;
    const words = text.trim().split(/\s+/);
    const matchedSigns: typeof signs.$inferSelect[] = [];

    for (const word of words) {
      // Try to find an exact phrase match first
      const [phraseMatch] = await db
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

      if (phraseMatch) {
        matchedSigns.push(phraseMatch);
      } else {
        // Fall back to fingerspelling
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
    }

    return NextResponse.json({ signs: matchedSigns, text });
  } catch {
    return NextResponse.json(
      { error: "Translation failed" },
      { status: 500 }
    );
  }
}
