"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles } from "lucide-react";
import { useTranslationStore } from "@/stores/translation-store";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function TranslationResult() {
  const { inputText, signSequence } = useTranslationStore();
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  if (signSequence.length === 0) return null;

  const phrases = signSequence.filter((s) => s.isPhrase);
  const letters = signSequence.filter((s) => !s.isPhrase && s.name.length === 1);
  const words = signSequence.filter((s) => !s.isPhrase && s.name.length > 1);

  const handleAIAssist = async () => {
    setLoadingAI(true);
    try {
      const res = await fetch("/api/translate/ai-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText, type: "translate" }),
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
          <span className="text-muted-foreground">Signs found: </span>
          <span>{signSequence.length}</span>
          {phrases.length > 0 && (
            <span className="ml-2 text-primary font-medium">
              ({phrases.length} phrase{phrases.length > 1 ? "s" : ""} matched ✓)
            </span>
          )}
        </div>

        {/* Phrase-level matches */}
        {phrases.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Phrase Signs
            </p>
            <div className="flex flex-wrap gap-1.5">
              {phrases.map((sign, i) => (
                <Badge
                  key={i}
                  className="bg-primary/15 text-primary border-primary/30 hover:bg-primary/20"
                  variant="outline"
                >
                  {sign.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Word-level matches */}
        {words.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Word Signs
            </p>
            <div className="flex flex-wrap gap-1.5">
              {words.map((sign, i) => (
                <Badge key={i} variant="secondary">
                  {sign.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Fingerspelled letters */}
        {letters.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Fingerspelled
            </p>
            <div className="flex flex-wrap gap-1">
              {letters.map((sign, i) => (
                <span
                  key={i}
                  className="rounded border bg-muted px-2 py-0.5 font-mono text-xs"
                >
                  {sign.name}
                </span>
              ))}
            </div>
          </div>
        )}

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
