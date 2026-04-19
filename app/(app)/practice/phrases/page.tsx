"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { PageHeader } from "@/components/shared/page-header";
import { CameraPermissionGate } from "@/components/practice/camera-permission-gate";
import { PracticePrompt } from "@/components/practice/practice-prompt";
import { PracticeFeedback } from "@/components/practice/practice-feedback";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePhraseStore } from "@/stores/phrase-store";
import { SkipForward, RotateCcw } from "lucide-react";
import { PHRASES } from "@/lib/data/phrases";

// Dynamic import to avoid SSR issues with MediaPipe/TF.js
const PhraseDetector = dynamic(
  () =>
    import("@/components/practice/phrase-detector").then(
      (m) => m.PhraseDetector
    ),
  { ssr: false }
);

const CATEGORIES = [
  "All", 
  "🏠 Basic Needs & Daily Life",
  "👋 Greetings & Introductions",
  "📞 Communication",
  "🏥 Emergency & Medical",
  "🏫 School / Work / Social"
] as const;

export default function PhrasePracticePage() {
  const {
    currentPrediction,
    targetPhrase,
    isCorrect,
    consecutiveCorrect,
    totalAttempts,
    setTargetPhrase,
    checkAnswer,
    resetSession,
  } = usePhraseStore();

  const [selectedCategory, setSelectedCategory] = useState<typeof CATEGORIES[number]>("All");
  const [phraseIndex, setPhraseIndex] = useState(0);

  const filteredPhrases = selectedCategory === "All" 
    ? PHRASES 
    : PHRASES.filter(p => p.category === selectedCategory);

  // Set initial target or update when category changes
  useEffect(() => {
    if (filteredPhrases.length > 0) {
      setPhraseIndex(0);
      setTargetPhrase(filteredPhrases[0].id);
    }
  }, [selectedCategory, setTargetPhrase]);

  // Reset session on mount
  useEffect(() => {
    return () => resetSession();
  }, []);

  // Check answer when prediction changes
  useEffect(() => {
    if (currentPrediction && targetPhrase) {
      checkAnswer();
    }
  }, [currentPrediction, targetPhrase, checkAnswer]);

  // Auto-advance on correct
  useEffect(() => {
    if (isCorrect) {
      const timer = setTimeout(() => {
        nextPhrase();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isCorrect]);

  const nextPhrase = useCallback(() => {
    const next = (phraseIndex + 1) % filteredPhrases.length;
    setPhraseIndex(next);
    setTargetPhrase(filteredPhrases[next].id);
  }, [phraseIndex, filteredPhrases, setTargetPhrase]);

  const currentPhraseData = PHRASES.find((p) => p.id === targetPhrase) || filteredPhrases[0] || PHRASES[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Phrases Practice"
        description="Practice common sign language phrases using your camera."
      />

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(cat)}
            className="rounded-full"
          >
            {cat}
          </Button>
        ))}
      </div>

      <CameraPermissionGate>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <PhraseDetector />

            <PracticeFeedback
              isCorrect={isCorrect}
              prediction={currentPrediction?.replace('_', ' ') ?? null}
              target={currentPhraseData.label}
            />
          </div>

          <div className="space-y-4">
            <PracticePrompt
              signName={currentPhraseData.label}
              signImageUrl={currentPhraseData.imageUrl}
              instructions={currentPhraseData.instructions}
            />

            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Score: <strong>{consecutiveCorrect}</strong> correct
                  </span>
                  <span className="text-muted-foreground">
                    Attempts: <strong>{totalAttempts}</strong>
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={nextPhrase}
              >
                <SkipForward className="mr-2 size-4" />
                Skip
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setPhraseIndex(0);
                  if (filteredPhrases.length > 0) {
                    setTargetPhrase(filteredPhrases[0].id);
                  }
                  resetSession();
                }}
              >
                <RotateCcw className="mr-2 size-4" />
                Reset
              </Button>
            </div>
          </div>
        </div>
      </CameraPermissionGate>
    </div>
  );
}
