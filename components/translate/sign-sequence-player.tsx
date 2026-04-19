"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Hand,
  BookOpen,
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
  const videoRef = useRef<HTMLVideoElement>(null);

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

  // Auto-play video when sign changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [currentSignIndex]);

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
  const isPhrase = currentSign?.isPhrase ?? false;

  // Determine media: prefer video (mp4/webm), then gifUrl, then imageUrl
  const videoSrc =
    currentSign?.gifUrl &&
    (currentSign.gifUrl.endsWith(".mp4") || currentSign.gifUrl.endsWith(".webm"))
      ? currentSign.gifUrl
      : null;

  const imageSrc = currentSign?.gifUrl || currentSign?.imageUrl;

  return (
    <div className="space-y-4">
      {/* ── Sign display ── */}
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border bg-muted/30 shadow-md">
        {videoSrc ? (
          <video
            ref={videoRef}
            src={videoSrc}
            autoPlay
            loop
            muted
            playsInline
            className="size-full object-contain p-4"
          />
        ) : imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt={currentSign.name}
            className="size-full object-contain p-4"
          />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <span className="text-6xl font-bold">{currentSign.name.charAt(0)}</span>
            <span className="text-sm text-muted-foreground">(No image available)</span>
          </div>
        )}

        {/* Phrase badge */}
        {isPhrase && (
          <div className="absolute left-3 top-3">
            <Badge className="bg-primary/90 text-primary-foreground text-[10px] font-semibold uppercase tracking-wider">
              Phrase Sign
            </Badge>
          </div>
        )}

        {/* Sign label */}
        <div className="absolute bottom-3 left-3 right-3">
          <div className="rounded-lg bg-black/70 px-3 py-1.5 backdrop-blur-sm">
            <span className="block text-sm font-semibold text-white leading-tight">
              {currentSign.name}
            </span>
          </div>
        </div>

        {/* Counter */}
        <div className="absolute right-3 top-3 rounded-md bg-black/70 px-2 py-1 text-xs text-white tabular-nums">
          {currentSignIndex + 1} / {signSequence.length}
        </div>
      </div>

      {/* ── Instructions (phrase-level only) ── */}
      {isPhrase && currentSign.instructions && (
        <div className="flex gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-foreground">
          <BookOpen className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="leading-relaxed">{currentSign.instructions}</p>
        </div>
      )}

      {/* ── Playback controls ── */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            pause();
            useTranslationStore.setState({
              currentSignIndex: Math.max(0, currentSignIndex - 1),
            });
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
          {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
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

      {/* ── Speed control ── */}
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

      {/* ── Sign sequence thumbnails ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {signSequence.map((sign, idx) => (
          <button
            key={`${sign.id}-${idx}`}
            onClick={() => {
              pause();
              useTranslationStore.setState({ currentSignIndex: idx });
            }}
            className={cn(
              "flex-shrink-0 rounded-full border px-3 py-1 text-xs transition-colors",
              sign.isPhrase
                ? idx === currentSignIndex
                  ? "border-primary bg-primary text-primary-foreground font-medium"
                  : "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
                : idx === currentSignIndex
                ? "border-border bg-muted text-foreground font-medium"
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
