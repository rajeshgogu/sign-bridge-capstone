import { db } from "@/lib/db";
import { quizzes, quizQuestions, signs } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params;
    const id = parseInt(quizId);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid quiz ID" }, { status: 400 });
    }

    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const questions = await db
      .select()
      .from(quizQuestions)
      .where(eq(quizQuestions.quizId, id))
      .orderBy(asc(quizQuestions.sortOrder));

    const questionsWithSigns = await Promise.all(
      questions.map(async (q) => {
        let sign = null;
        if (q.signId) {
          const [s] = await db
            .select()
            .from(signs)
            .where(eq(signs.id, q.signId));
          sign = s ?? null;
        }
        return { ...q, sign };
      })
    );

    return NextResponse.json({ ...quiz, questions: questionsWithSigns });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch quiz" },
      { status: 500 }
    );
  }
}
