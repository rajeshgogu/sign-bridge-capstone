"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PracticeFeedbackProps {
  isCorrect: boolean | null;
  prediction: string | null;
  target: string | null;
}

export function PracticeFeedback({
  isCorrect,
  prediction,
  target,
}: PracticeFeedbackProps) {
  if (isCorrect === null) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg px-4 py-3 transition-all",
        isCorrect
          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      )}
    >
      {isCorrect ? (
        <CheckCircle2 className="size-5 shrink-0" />
      ) : (
        <XCircle className="size-5 shrink-0" />
      )}
      <div className="text-sm">
        {isCorrect ? (
          <span>
            Correct! You signed <strong>{target}</strong>
          </span>
        ) : (
          <span>
            Detected <strong>{prediction}</strong>, expected{" "}
            <strong>{target}</strong>. Try again!
          </span>
        )}
      </div>
    </div>
  );
}
