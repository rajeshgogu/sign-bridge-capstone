"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { QuizQuestion } from "@/components/quiz/quiz-question";
import { QuizTimer } from "@/components/quiz/quiz-timer";
import { QuizResultsSummary } from "@/components/quiz/quiz-results-summary";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuizStore } from "@/stores/quiz-store";

interface QuizData {
  id: number;
  title: string;
  description: string | null;
  timeLimitSeconds: number | null;
  questions: {
    id: number;
    questionType: string;
    questionText: string;
    options: string[] | null;
    correctAnswer: string;
    signId: number | null;
    sign?: { imageUrl: string | null; gifUrl: string | null } | null;
  }[];
}

export default function QuizPage() {
  const params = useParams<{ quizId: string }>();
  const router = useRouter();
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<{
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    answers: { questionId: number; answer: string; correct: boolean }[];
  } | null>(null);

  const {
    questions,
    currentQuestionIndex,
    answers,
    timeRemaining,
    isSubmitted,
    startQuiz,
    answerQuestion,
    nextQuestion,
    previousQuestion,
    tick,
    submitQuiz: submitLocal,
    resetQuiz,
  } = useQuizStore();

  useEffect(() => {
    async function fetchQuiz() {
      try {
        const res = await fetch(`/api/quizzes/${params.quizId}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setQuiz(data);
        startQuiz(data.id, data.questions, data.timeLimitSeconds);
      } catch {
        toast.error("Failed to load quiz");
      } finally {
        setLoading(false);
      }
    }
    fetchQuiz();
    return () => resetQuiz();
  }, [params.quizId]);

  const handleSubmit = useCallback(async () => {
    if (submitting || !quiz) return;
    setSubmitting(true);

    const startTime =
      quiz.timeLimitSeconds && timeRemaining !== null
        ? quiz.timeLimitSeconds - timeRemaining
        : undefined;

    try {
      const res = await fetch(`/api/quizzes/${quiz.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: Object.entries(answers).map(([qId, answer]) => ({
            questionId: parseInt(qId),
            answer,
          })),
          timeTakenSeconds: startTime,
        }),
      });

      if (!res.ok) throw new Error("Submit failed");
      const data = await res.json();
      submitLocal();
      setResults(data);
    } catch {
      toast.error("Failed to submit quiz");
    } finally {
      setSubmitting(false);
    }
  }, [submitting, quiz, answers, timeRemaining, submitLocal]);

  // Auto-submit on timer expiry
  useEffect(() => {
    if (timeRemaining === 0 && !isSubmitted) {
      handleSubmit();
    }
  }, [timeRemaining, isSubmitted, handleSubmit]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">Quiz not found.</p>
      </div>
    );
  }

  if (quiz.questions.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title={quiz.title} description={quiz.description ?? undefined} />
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-16 text-center">
          <p className="text-2xl">📋</p>
          <p className="font-medium">No questions available yet</p>
          <p className="text-sm text-muted-foreground">
            This quiz doesn&apos;t have any questions loaded. Please re-run the seed script or check back later.
          </p>
          <Button variant="outline" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (results) {
    return (
      <div className="space-y-6">
        <PageHeader title="Quiz Results" description={quiz.title} />
        <QuizResultsSummary
          score={results.score}
          totalQuestions={results.totalQuestions}
          correctAnswers={results.correctAnswers}
          answers={results.answers}
        />
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const quizQuestion = quiz.questions.find((q) => q.id === currentQuestion?.id);
  const progressPercent =
    ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title={quiz.title} />
        {timeRemaining !== null && (
          <QuizTimer timeRemaining={timeRemaining} onTick={tick} />
        )}
      </div>

      <div className="flex items-center gap-3">
        <Progress value={progressPercent} className="flex-1" />
        <span className="text-sm text-muted-foreground tabular-nums">
          {currentQuestionIndex + 1}/{questions.length}
        </span>
      </div>

      {currentQuestion && (
        <QuizQuestion
          questionText={currentQuestion.questionText}
          questionType={currentQuestion.questionType}
          options={currentQuestion.options}
          selectedAnswer={answers[currentQuestion.id]}
          signImageUrl={quizQuestion?.sign?.imageUrl}
          signGifUrl={quizQuestion?.sign?.gifUrl}
          onAnswer={(answer) => answerQuestion(currentQuestion.id, answer)}
          isSubmitted={isSubmitted}
        />
      )}

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={previousQuestion}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </Button>

        {currentQuestionIndex < questions.length - 1 ? (
          <Button onClick={nextQuestion}>Next</Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Quiz"}
          </Button>
        )}
      </div>
    </div>
  );
}
