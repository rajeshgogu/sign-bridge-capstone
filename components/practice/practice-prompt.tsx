"use client";

import { Card, CardContent } from "@/components/ui/card";

interface PracticePromptProps {
  signName: string;
  signImageUrl?: string | null;
  instructions?: string | null;
}

export function PracticePrompt({
  signName,
  signImageUrl,
  instructions,
}: PracticePromptProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-6">
        <p className="text-sm text-muted-foreground">Show this sign:</p>
        <div className="text-4xl font-bold">{signName}</div>

        {signImageUrl && (
          <div className="overflow-hidden rounded-lg border bg-muted">
            <img
              src={signImageUrl}
              alt={`ISL sign for ${signName}`}
              className="h-32 w-auto object-contain"
            />
          </div>
        )}

        {instructions && (
          <p className="max-w-md text-center text-sm text-muted-foreground">
            {instructions}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
