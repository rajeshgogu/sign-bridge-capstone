"use client";

import { useState, useRef } from "react";
import { CheckCircle2, Play } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SignData } from "@/types";

interface SignCardProps {
  sign: SignData;
  learned?: boolean;
  onClick?: () => void;
}

export function SignCard({ sign, learned, onClick }: SignCardProps) {
  const [mediaError, setMediaError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const hasVideo =
    !!sign.videoUrl &&
    (sign.videoUrl.endsWith(".mp4") ||
      sign.videoUrl.endsWith(".webm") ||
      sign.videoUrl.endsWith(".ogg"));

  const hasGif =
    !!sign.gifUrl && sign.gifUrl.endsWith(".gif");

  // Prefer gifUrl > videoUrl > imageUrl for display
  const staticSrc = sign.gifUrl || sign.imageUrl;

  const handleMouseEnter = () => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <Card
      className={cn(
        "relative cursor-pointer overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 group",
        learned && "border-green-500/30"
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="p-3">
        <div className="relative aspect-square w-full overflow-hidden rounded-md bg-muted">

          {/* ── Video (mp4/webm) ── */}
          {hasVideo && !mediaError && (
            <>
              <video
                ref={videoRef}
                src={sign.videoUrl!}
                loop
                muted
                playsInline
                preload="none"
                className="absolute inset-0 size-full object-cover"
                onError={() => setMediaError(true)}
              />
              {/* Play badge hint */}
              <div className="absolute bottom-1 right-1 flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] text-white opacity-80 group-hover:opacity-0 transition-opacity">
                <Play className="size-2.5" />
                Hover
              </div>
            </>
          )}

          {/* ── Animated GIF or static image ── */}
          {!hasVideo && staticSrc && !mediaError && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={staticSrc}
              alt={sign.name}
              className="absolute inset-0 size-full object-cover"
              onError={() => setMediaError(true)}
            />
          )}

          {/* ── Fallback: initial letter ── */}
          {(mediaError || (!hasVideo && !staticSrc)) && (
            <div className="flex size-full items-center justify-center text-2xl font-bold text-muted-foreground">
              {sign.name.charAt(0).toUpperCase()}
            </div>
          )}

          {/* GIF badge */}
          {hasGif && !hasVideo && !mediaError && (
            <span className="absolute bottom-1 right-1 rounded-full bg-primary/80 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary-foreground">
              GIF
            </span>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between gap-1">
          <span className="truncate text-sm font-medium">{sign.name}</span>

          {learned && (
            <Badge className="shrink-0 bg-green-600 text-white">
              <CheckCircle2 className="size-3" />
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}