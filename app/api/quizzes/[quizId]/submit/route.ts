import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { quizQuestions, quizAttempts, userActivity } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { submitQuizSchema } from "@/lib/validators/quiz";
import { updateStreak } from "@/lib/helpers/streak";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { quizId } = await params;
    const id = parseInt(quizId);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid quiz ID" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = submitQuizSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { answers, timeTakenSeconds } = parsed.data;

    // Get correct answers from DB
    const questions = await db
      .select()
      .from(quizQuestions)
      .where(eq(quizQuestions.quizId, id));

    const questionMap = new Map(questions.map((q) => [q.id, q]));

    let correctCount = 0;
    const graded = answers.map((a) => {
      const question = questionMap.get(a.questionId);
      const isCorrect = question?.correctAnswer === a.answer;
      if (isCorrect) correctCount++;
      return {
        questionId: a.questionId,
        answer: a.answer,
        correct: isCorrect,
      };
    });

    const totalQuestions = questions.length;
    const score = Math.round((correctCount / totalQuestions) * 100);

    const [attempt] = await db
      .insert(quizAttempts)
      .values({
        userId,
        quizId: id,
        score,
        totalQuestions,
        correctAnswers: correctCount,
        answers: graded,
        timeTakenSeconds: timeTakenSeconds ?? null,
      })
      .returning();

    await db.insert(userActivity).values({
      userId,
      activityType: "quiz_completed",
      entityType: "quiz",
      entityId: id,
      metadata: { score, correctAnswers: correctCount, totalQuestions },
    });

    await updateStreak(userId);

    return NextResponse.json({
      attemptId: attempt.id,
      score,
      totalQuestions,
      correctAnswers: correctCount,
      answers: graded,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to submit quiz" },
      { status: 500 }
    );
  }
}
