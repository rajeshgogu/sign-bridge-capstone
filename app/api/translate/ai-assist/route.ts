import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { aiAssistSchema } from "@/lib/validators/translate";
import { generateContent } from "@/lib/ai/gemini";
import {
  getTranslationAssistPrompt,
  getSignExplanationPrompt,
} from "@/lib/ai/prompts";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = aiAssistSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }

    const { text, type } = parsed.data;

    const prompt =
      type === "explain"
        ? getSignExplanationPrompt(text)
        : getTranslationAssistPrompt(text);

    const response = await generateContent(prompt);

    return NextResponse.json({ response });
  } catch (err) {
    console.error("AI assist error:", err);
    const message =
      err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "AI assist failed", details: message },
      { status: 500 }
    );
  }
}
