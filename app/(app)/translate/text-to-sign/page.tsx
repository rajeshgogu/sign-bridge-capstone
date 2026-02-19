"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { TextInputPanel } from "@/components/translate/text-input-panel";
import { SignSequencePlayer } from "@/components/translate/sign-sequence-player";
import { TranslationResult } from "@/components/translate/translation-result";
import { useTranslationStore } from "@/stores/translation-store";

export default function TextToSignPage() {
  const { setSignSequence, setTranslating, reset } = useTranslationStore();

  const handleTranslate = useCallback(
    async (text: string) => {
      setTranslating(true);
      try {
        const res = await fetch("/api/translate/text-to-sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        if (!res.ok) throw new Error("Translation failed");

        const data = await res.json();
        if (data.signs.length === 0) {
          toast.info("No matching signs found for that input.");
          return;
        }
        setSignSequence(data.signs);
      } catch {
        toast.error("Failed to translate. Please try again.");
      } finally {
        setTranslating(false);
      }
    },
    [setSignSequence, setTranslating]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Text / Voice to Sign"
        description="Type or speak text to see the corresponding ISL signs."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <TextInputPanel onTranslate={handleTranslate} />
          <TranslationResult />
        </div>

        <div>
          <SignSequencePlayer />
        </div>
      </div>
    </div>
  );
}
