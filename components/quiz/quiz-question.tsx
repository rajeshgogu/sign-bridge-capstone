"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface QuizQuestionProps {
  questionText: string;
  questionType: string;
  options: string[] | null;
  selectedAnswer: string | undefined;
  signImageUrl?: string | null;
  signGifUrl?: string | null;
  onAnswer: (answer: string) => void;
  isSubmitted: boolean;
  correctAnswer?: string;
}

export function QuizQuestion({
  questionText,
  options,
  selectedAnswer,
  signImageUrl,
  signGifUrl,
  onAnswer,
  isSubmitted,
  correctAnswer,
}: QuizQuestionProps) {
  const imageUrl = signGifUrl || signImageUrl;

  return (
    <div className="space-y-6">
      {imageUrl && (
        <div className="flex justify-center">
          <div className="overflow-hidden rounded-lg border bg-muted">
            <img
              src={imageUrl}
              alt="Sign"
              className="h-48 w-auto object-contain"
            />
          </div>
        </div>
      )}

      <h3 className="text-lg font-semibold text-center">{questionText}</h3>

      {options && (
        <div className="grid gap-3 sm:grid-cols-2">
          {options.map((option) => {
            const isSelected = selectedAnswer === option;
            const isCorrect = correctAnswer === option;

            return (
              <Button
                key={option}
                variant="outline"
                className={cn(
                  "h-auto min-h-[48px] justify-start whitespace-normal text-left",
                  isSelected && !isSubmitted && "border-primary bg-primary/10",
                  isSubmitted &&
                    isCorrect &&
                    "border-green-500 bg-green-50 dark:bg-green-950",
                  isSubmitted &&
                    isSelected &&
                    !isCorrect &&
                    "border-red-500 bg-red-50 dark:bg-red-950"
                )}
                onClick={() => !isSubmitted && onAnswer(option)}
                disabled={isSubmitted}
              >
                {option}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
