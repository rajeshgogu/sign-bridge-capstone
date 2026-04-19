"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ImageIcon, Info } from "lucide-react";

interface PracticePromptProps {
  signName: string;
  /** Primary demonstration image (High-quality 3D render preferred) */
  signImageUrl?: string | null;
  instructions?: string | null;
}

export function PracticePrompt({
  signName,
  signImageUrl,
  instructions,
}: PracticePromptProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Reset states when media URL changes
  useEffect(() => {
    setHasError(false);
    setIsLoading(true);
  }, [signImageUrl]);

  return (
    <Card className="overflow-hidden border-none bg-gradient-to-br from-background/50 to-muted/30 backdrop-blur-xl shadow-2xl">
      <CardContent className="flex flex-col items-center gap-6 py-10 px-8">
        <div className="space-y-2 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
            Show this sign
          </p>
          <h2 className="text-5xl font-black tracking-tight text-foreground sm:text-6xl">
            {signName}
          </h2>
        </div>

        {/* ── Premium Image Container ── */}
        <div className="relative group w-full max-w-md aspect-square rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-b from-white/5 to-white/10 shadow-[inner_0_1px_20px_rgba(255,255,255,0.05)] transition-all duration-500 hover:shadow-[0_0_50px_rgba(0,170,255,0.15)]">
          
          {/* Subtle Background Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,170,255,0.1),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/20 animate-pulse z-10 gap-3">
              <div className="size-12 rounded-full border-t-2 border-primary animate-spin" />
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.3em]">
                Enhancing View...
              </span>
            </div>
          )}

          {signImageUrl && !hasError ? (
            <img
              src={signImageUrl}
              alt={`Premium ISL demonstration for ${signName}`}
              className={cn(
                "h-full w-full object-cover transition-all duration-700 ease-out",
                isLoading ? "scale-110 opacity-0 blur-xl" : "scale-100 opacity-100 blur-0",
                "group-hover:scale-105"
              )}
              onLoad={() => setIsLoading(false)}
              onError={() => setHasError(true)}
            />
          ) : (
             <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-muted/30 text-center p-8">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10">
                  <ImageIcon className="size-8 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                   <p className="text-sm font-bold">Visual Update in Progress</p>
                   <p className="text-xs text-muted-foreground leading-relaxed">
                     We are generating high-fidelity 3D assets for this phrase. Please see the instructions below.
                   </p>
                </div>
             </div>
          )}

          {/* Premium Badge */}
          {!isLoading && !hasError && (
            <div className="absolute bottom-4 right-4 translate-y-0 opacity-100 transition-all duration-500 group-hover:translate-y-[-4px]">
               <div className="flex items-center gap-2 rounded-full bg-black/40 backdrop-blur-md px-3 py-1 border border-white/10">
                  <div className="size-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-[10px] font-bold text-white/90 uppercase tracking-widest leading-none">
                    Premium Asset
                  </span>
               </div>
            </div>
          )}
        </div>

        {/* ── Visual Instructions Card ── */}
        {instructions && (
          <div className="w-full max-w-md rounded-2xl bg-white/5 border border-white/10 p-5 group flex gap-4 items-start transition-all hover:bg-white/[0.08]">
            <div className="size-10 shrink-0 flex items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Info className="size-5" />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Detailed Motion</p>
              <p className="text-sm leading-relaxed text-muted-foreground group-hover:text-foreground transition-colors italic">
                &ldquo;{instructions}&rdquo;
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
