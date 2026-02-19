import { db } from "@/lib/db";
import { quizzes, quizAttempts, categories } from "@/lib/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { PageHeader } from "@/components/shared/page-header";
import { QuizCard } from "@/components/quiz/quiz-card";

export default async function QuizzesPage() {
  const { userId } = await auth();

  const allQuizzes = await db
    .select()
    .from(quizzes)
    .orderBy(asc(quizzes.id));

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
        if (attempts.length > 0) bestScore = attempts[0].score;
      }
      return { ...quiz, bestScore };
    })
  );

  return (
    <div>
      <PageHeader
        title="Quizzes"
        description="Test your sign language knowledge."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quizzesWithScores.map((quiz) => (
          <QuizCard
            key={quiz.id}
            id={quiz.id}
            title={quiz.title}
            description={quiz.description}
            difficulty={quiz.difficulty}
            questionCount={quiz.questionCount}
            timeLimitSeconds={quiz.timeLimitSeconds}
            bestScore={quiz.bestScore}
          />
        ))}
      </div>
    </div>
  );
}
