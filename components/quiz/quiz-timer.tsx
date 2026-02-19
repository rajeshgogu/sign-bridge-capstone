"use client";

import { useEffect } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizTimerProps {
  timeRemaining: number;
  onTick: () => void;
}

export function QuizTimer({ timeRemaining, onTick }: QuizTimerProps) {
  useEffect(() => {
    if (timeRemaining <= 0) return;
    const interval = setInterval(onTick, 1000);
    return () => clearInterval(interval);
  }, [timeRemaining, onTick]);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const isWarning = timeRemaining <= 30;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-sm font-mono tabular-nums",
        isWarning && "text-destructive animate-pulse"
      )}
    >
      <Clock className="size-4" />
      {minutes}:{seconds.toString().padStart(2, "0")}
    </div>
  );
}
