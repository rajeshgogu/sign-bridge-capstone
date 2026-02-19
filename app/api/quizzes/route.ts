import { db } from "@/lib/db";
import { quizzes, quizAttempts } from "@/lib/db/schema";
import { eq, asc, desc } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");

    let query = db.select().from(quizzes).$dynamic();

    if (categoryId) {
      query = query.where(eq(quizzes.categoryId, parseInt(categoryId)));
    }

    const allQuizzes = await query.orderBy(asc(quizzes.id));

    const quizzesWithScores = await Promise.all(
      allQuizzes.map(async (quiz) => {
        let bestScore: number | null = null;
        if (userId) {
          const attempts = await db
            .select()
            .from(quizAttempts)
            .where(eq(quizAttempts.quizId, quiz.id))
            .orderBy(desc(quizAttempts.score))
            .limit(1);
          if (attempts.length > 0) {
            bestScore = attempts[0].score;
          }
        }
        return { ...quiz, bestScore };
      })
    );

    return NextResponse.json(quizzesWithScores);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch quizzes" },
      { status: 500 }
    );
  }
}
