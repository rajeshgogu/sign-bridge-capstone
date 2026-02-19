"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";
import { useTranslationStore } from "@/stores/translation-store";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function TranslationResult() {
  const { inputText, signSequence } = useTranslationStore();
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  if (signSequence.length === 0) return null;

  const matchedWords = signSequence.map((s) => s.name);
  const fingerspelled = signSequence
    .filter((s) => s.name.length === 1)
    .map((s) => s.name);

  const handleAIAssist = async () => {
    setLoadingAI(true);
    try {
      const res = await fetch("/api/translate/ai-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText,
          type: "translate",
        }),
      });
      if (!res.ok) throw new Error("AI assist failed");
      const data = await res.json();
      setAiExplanation(data.response);
    } catch {
      setAiExplanation("Unable to get AI explanation at this time.");
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Translation Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm">
          <span className="text-muted-foreground">Input: </span>
          <span className="font-medium">&ldquo;{inputText}&rdquo;</span>
        </div>

        <div className="text-sm">
          <span className="text-muted-foreground">Signs matched: </span>
          <span>{signSequence.length}</span>
        </div>

        {fingerspelled.length > 0 && (
          <div className="text-sm">
            <span className="text-muted-foreground">Fingerspelled: </span>
            <span className="font-mono">{fingerspelled.join("")}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          {matchedWords.map((word, i) => (
            <span
              key={i}
              className="rounded-full border bg-muted px-2 py-0.5 text-xs"
            >
              {word}
            </span>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleAIAssist}
          disabled={loadingAI}
          className="w-full"
        >
          {loadingAI ? (
            <>
              <Loader2 className="mr-2 size-3.5 animate-spin" />
              Getting explanation...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 size-3.5" />
              Explain with AI
            </>
          )}
        </Button>

        {aiExplanation && (
          <div className="rounded-md border bg-muted/50 p-3 text-sm prose prose-sm dark:prose-invert max-w-none
            prose-headings:font-semibold prose-headings:text-foreground
            prose-h3:text-sm prose-h3:mt-3 prose-h3:mb-1
            prose-p:text-foreground prose-p:leading-relaxed prose-p:my-1
            prose-strong:text-foreground prose-strong:font-semibold
            prose-ul:my-1 prose-ul:pl-4 prose-li:my-0.5
            prose-ol:my-1 prose-ol:pl-4
            prose-code:bg-muted prose-code:px-1 prose-code:rounded prose-code:text-xs
            prose-hr:my-2">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {aiExplanation}
            </ReactMarkdown>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
