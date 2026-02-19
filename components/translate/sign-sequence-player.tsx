"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Hand,
} from "lucide-react";
import { useTranslationStore } from "@/stores/translation-store";
import { cn } from "@/lib/utils";

export function SignSequencePlayer() {
  const {
    signSequence,
    currentSignIndex,
    isPlaying,
    playbackSpeed,
    play,
    pause,
    nextSign,
    setPlaybackSpeed,
  } = useTranslationStore();

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-advance when playing
  useEffect(() => {
    if (isPlaying && signSequence.length > 0) {
      timerRef.current = setInterval(() => {
        nextSign();
      }, 2000 / playbackSpeed);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed, nextSign, signSequence.length]);

  if (signSequence.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-lg border border-dashed">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Hand className="size-10" />
          <p className="text-sm">Sign output will appear here</p>
        </div>
      </div>
    );
  }

  const currentSign = signSequence[currentSignIndex];
  const imageUrl = currentSign?.gifUrl || currentSign?.imageUrl;

  return (
    <div className="space-y-4">
      {/* Sign display */}
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg border bg-muted/30">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={currentSign.name}
            fill
            className="object-contain p-4"
            unoptimized={imageUrl.endsWith(".gif")}
          />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <span className="text-6xl font-bold">{currentSign.name}</span>
            <span className="text-sm text-muted-foreground">
              (No image available)
            </span>
          </div>
        )}

        {/* Sign label */}
        <div className="absolute bottom-3 left-3 rounded-md bg-black/70 px-3 py-1 text-white">
          <span className="text-sm font-medium">{currentSign.name}</span>
        </div>

        {/* Counter */}
        <div className="absolute right-3 top-3 rounded-md bg-black/70 px-2 py-1 text-xs text-white tabular-nums">
          {currentSignIndex + 1} / {signSequence.length}
        </div>
      </div>

      {/* Playback controls */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            pause();
            const prev = Math.max(0, currentSignIndex - 1);
            // We use store's internal state, so manually set
            useTranslationStore.setState({ currentSignIndex: prev });
          }}
          disabled={currentSignIndex === 0}
          aria-label="Previous sign"
        >
          <SkipBack className="size-4" />
        </Button>

        <Button
          size="icon"
          onClick={isPlaying ? pause : play}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="size-4" />
          ) : (
            <Play className="size-4" />
          )}
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            pause();
            nextSign();
          }}
          disabled={currentSignIndex === signSequence.length - 1}
          aria-label="Next sign"
        >
          <SkipForward className="size-4" />
        </Button>
      </div>

      {/* Speed control */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">Speed</span>
        <Slider
          value={[playbackSpeed]}
          onValueChange={([val]) => setPlaybackSpeed(val)}
          min={0.5}
          max={3}
          step={0.5}
          className="flex-1"
        />
        <span className="text-xs tabular-nums text-muted-foreground">
          {playbackSpeed}x
        </span>
      </div>

      {/* Sign sequence thumbnails */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {signSequence.map((sign, idx) => (
          <button
            key={`${sign.id}-${idx}`}
            onClick={() => {
              pause();
              useTranslationStore.setState({ currentSignIndex: idx });
            }}
            className={cn(
              "flex-shrink-0 rounded border px-2 py-1 text-xs transition-colors",
              idx === currentSignIndex
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:bg-muted"
            )}
          >
            {sign.name}
          </button>
        ))}
      </div>
    </div>
  );
}
