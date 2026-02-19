"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LessonNavigationProps {
  currentIndex: number;
  totalSigns: number;
  onPrevious: () => void;
  onNext: () => void;
  className?: string;
}

export function LessonNavigation({
  currentIndex,
  totalSigns,
  onPrevious,
  onNext,
  className,
}: LessonNavigationProps) {
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalSigns - 1;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4",
        className
      )}
    >
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={isFirst}
        aria-label="Previous sign"
      >
        <ChevronLeft className="size-4" />
        Previous
      </Button>

      <span className="text-sm text-muted-foreground tabular-nums">
        Sign {currentIndex + 1} of {totalSigns}
      </span>

      <Button
        variant="outline"
        onClick={onNext}
        disabled={isLast}
        aria-label="Next sign"
      >
        Next
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
