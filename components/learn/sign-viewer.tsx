"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, Info } from "lucide-react";
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
  const mediaSrc = sign.gifUrl || sign.imageUrl;

  return (
    <div className="w-full space-y-6">
      {/* Sign media */}
      {mediaSrc && (
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mediaSrc}
            alt={sign.name}
            className="max-h-80 w-auto rounded-lg border object-contain"
          />
        </div>
      )}

      {/* Sign name */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">{sign.name}</h2>
        {sign.hindiText && (
          <p className="text-lg text-muted-foreground">{sign.hindiText}</p>
        )}
        {sign.englishText && (
          <p className="text-base text-muted-foreground">{sign.englishText}</p>
        )}
      </div>

      {/* Description */}
      {sign.description && (
        <p className="text-muted-foreground text-sm text-center max-w-prose mx-auto">
          {sign.description}
        </p>
      )}

      {/* Instructions collapsible */}
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

      {/* Mark as Learned button */}
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
