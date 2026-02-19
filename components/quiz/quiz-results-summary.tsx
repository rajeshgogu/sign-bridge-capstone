"use client";

import Link from "next/link";
import { CheckCircle2, XCircle, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuizResultsSummaryProps {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeTakenSeconds?: number | null;
  answers: { questionId: number; answer: string; correct: boolean }[];
}

export function QuizResultsSummary({
  score,
  totalQuestions,
  correctAnswers,
  timeTakenSeconds,
}: QuizResultsSummaryProps) {
  const isPassing = score >= 70;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Card>
        <CardHeader className="text-center">
          <div
            className={cn(
              "mx-auto mb-2 flex size-16 items-center justify-center rounded-full",
              isPassing ? "bg-green-100 dark:bg-green-900" : "bg-red-100 dark:bg-red-900"
            )}
          >
            <Trophy
              className={cn(
                "size-8",
                isPassing ? "text-green-600" : "text-red-600"
              )}
            />
          </div>
          <CardTitle className="text-2xl">
            {isPassing ? "Great job!" : "Keep practicing!"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-5xl font-bold">{score}%</div>
            <p className="mt-1 text-sm text-muted-foreground">
              {correctAnswers} of {totalQuestions} correct
            </p>
            {timeTakenSeconds && (
              <p className="text-xs text-muted-foreground">
                Time: {Math.floor(timeTakenSeconds / 60)}m{" "}
                {timeTakenSeconds % 60}s
              </p>
            )}
          </div>

          <div className="flex justify-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle2 className="size-4" />
              {correctAnswers} correct
            </div>
            <div className="flex items-center gap-1 text-red-600">
              <XCircle className="size-4" />
              {totalQuestions - correctAnswers} wrong
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" asChild>
              <Link href="/practice/quiz">Back to Quizzes</Link>
            </Button>
            <Button className="flex-1" asChild>
              <Link href="/learn">Continue Learning</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
