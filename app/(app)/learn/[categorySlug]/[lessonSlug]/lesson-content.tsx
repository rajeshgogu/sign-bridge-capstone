"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { SignViewer } from "@/components/learn/sign-viewer";
import { LessonProgressBar } from "@/components/learn/lesson-progress-bar";
import { LessonNavigation } from "@/components/learn/lesson-navigation";
import { SignCard } from "@/components/learn/sign-card";
import type { SignData } from "@/types";

interface LessonContentProps {
  lessonId: number;
  signs: SignData[];
  learnedSignIds: number[];
}

export function LessonContent({
  lessonId,
  signs,
  learnedSignIds: initialLearnedSignIds,
}: LessonContentProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [learnedIds, setLearnedIds] = useState<Set<number>>(
    new Set(initialLearnedSignIds)
  );

  const currentSign = signs[currentIndex];

  const handleMarkLearned = useCallback(async () => {
    if (!currentSign) return;

    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId,
          signId: currentSign.id,
          action: "mark_learned",
        }),
      });

      if (!res.ok) throw new Error("Failed to mark as learned");

      setLearnedIds((prev) => {
        const next = new Set(prev);
        next.add(currentSign.id);
        return next;
      });

      toast.success(`"${currentSign.name}" marked as learned!`);
    } catch {
      toast.error("Failed to update progress");
    }
  }, [currentSign, lessonId]);

  if (signs.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed p-12">
        <p className="text-muted-foreground">
          No signs found in this lesson.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <LessonProgressBar completed={learnedIds.size} total={signs.length} />

      <SignViewer
        sign={currentSign}
        lessonId={lessonId}
        isLearned={learnedIds.has(currentSign.id)}
        onMarkLearned={handleMarkLearned}
      />

      <LessonNavigation
        currentIndex={currentIndex}
        totalSigns={signs.length}
        onPrevious={() => setCurrentIndex((i) => Math.max(0, i - 1))}
        onNext={() =>
          setCurrentIndex((i) => Math.min(signs.length - 1, i + 1))
        }
      />

      {/* Sign thumbnails grid */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">
          All Signs in This Lesson
        </h3>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {signs.map((sign, index) => (
            <SignCard
              key={sign.id}
              sign={sign}
              learned={learnedIds.has(sign.id)}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
