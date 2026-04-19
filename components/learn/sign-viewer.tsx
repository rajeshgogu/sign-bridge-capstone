"use client";

import { useState, useRef } from "react";
import { CheckCircle2, ChevronDown, Info, Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { SignData } from "@/types";

interface SignViewerProps {
  sign: SignData;
  lessonId: number;
  isLearned: boolean;
  onMarkLearned: () => void;
}

export function SignViewer({
  sign,
  isLearned,
  onMarkLearned,
}: SignViewerProps) {
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const hasVideo =
    !!sign.videoUrl &&
    (sign.videoUrl.endsWith(".mp4") ||
      sign.videoUrl.endsWith(".webm") ||
      sign.videoUrl.endsWith(".ogg"));

  const hasGif = !!sign.gifUrl && sign.gifUrl.endsWith(".gif");

  // Priority: videoUrl > gifUrl > imageUrl
  const fallbackSrc = sign.gifUrl || sign.imageUrl;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const restart = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play().catch(() => {});
    setIsPlaying(true);
  };

  return (
    <div className="w-full space-y-6">
      {/* ── Sign media ── */}
      <div className="flex justify-center">
        {hasVideo && !mediaError ? (
          /* ── Video player ── */
          <div className="relative w-full max-w-sm overflow-hidden rounded-xl border shadow-md bg-black">
            <video
              ref={videoRef}
              src={sign.videoUrl!}
              loop
              muted
              playsInline
              preload="metadata"
              className="w-full rounded-xl object-cover"
              onError={() => setMediaError(true)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />

            {/* Video controls overlay */}
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/80">
                ISL Demonstration
              </span>
              <div className="flex gap-1">
                <button
                  onClick={restart}
                  className="flex size-7 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/30 transition-colors"
                  aria-label="Restart"
                >
                  <RotateCcw className="size-3.5" />
                </button>
                <button
                  onClick={togglePlay}
                  className="flex size-7 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/30 transition-colors"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause className="size-3.5" />
                  ) : (
                    <Play className="size-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : fallbackSrc && !mediaError ? (
          /* ── GIF / Static image ── */
          <div className="relative w-full max-w-sm overflow-hidden rounded-xl border shadow-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fallbackSrc}
              alt={sign.name}
              className="max-h-80 w-full rounded-xl border object-contain"
              onError={() => setMediaError(true)}
            />
            {hasGif && (
              <span className="absolute bottom-2 right-2 rounded-full bg-primary/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                Animated
              </span>
            )}
          </div>
        ) : (
          /* ── Fallback: initial letter ── */
          <div className="flex h-48 w-full max-w-sm items-center justify-center rounded-xl border-2 border-dashed bg-muted text-4xl font-bold text-muted-foreground">
            {sign.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Add video badge under media if one exists */}
      {hasVideo && !mediaError && (
        <p className="text-center text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Play className="size-3" />
            Video demonstration — hover or tap to play/pause
          </span>
        </p>
      )}

      {/* ── Sign name ── */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">{sign.name}</h2>
        {sign.hindiText && (
          <p className="text-lg text-muted-foreground">{sign.hindiText}</p>
        )}
        {sign.englishText && (
          <p className="text-base text-muted-foreground">{sign.englishText}</p>
        )}
      </div>

      {/* ── Description ── */}
      {sign.description && (
        <p className="text-muted-foreground text-sm text-center max-w-prose mx-auto">
          {sign.description}
        </p>
      )}

      {/* ── Instructions collapsible ── */}
      {sign.instructions && (
        <Collapsible open={instructionsOpen} onOpenChange={setInstructionsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Info className="size-4" />
                Instructions
              </span>
              <ChevronDown
                className={cn(
                  "size-4 transition-transform duration-200",
                  instructionsOpen && "rotate-180"
                )}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-3 rounded-lg border bg-muted/50 p-4 text-sm leading-relaxed whitespace-pre-line">
              {sign.instructions}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* ── Mark as Learned button ── */}
      <div className="flex justify-center">
        <Button
          onClick={onMarkLearned}
          disabled={isLearned}
          size="lg"
          className={cn(
            isLearned &&
              "bg-green-600 text-white hover:bg-green-600 disabled:opacity-100"
          )}
        >
          {isLearned ? (
            <>
              <CheckCircle2 className="size-5" />
              Learned
            </>
          ) : (
            "Mark as Learned"
          )}
        </Button>
      </div>
    </div>
  );
}
