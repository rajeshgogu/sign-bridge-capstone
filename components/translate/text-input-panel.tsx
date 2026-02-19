"use client";

import { useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Languages, Loader2 } from "lucide-react";
import { VoiceInputButton } from "./voice-input-button";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useTranslationStore } from "@/stores/translation-store";

interface TextInputPanelProps {
  onTranslate: (text: string) => void;
}

export function TextInputPanel({ onTranslate }: TextInputPanelProps) {
  const { inputText, setInputText, isTranslating } = useTranslationStore();
  const {
    isListening,
    isSupported: speechSupported,
    start,
    stop,
    transcript,
  } = useSpeechRecognition("en-IN");

  // Sync speech transcript to input
  const handleVoiceToggle = useCallback(() => {
    if (isListening) {
      stop();
      if (transcript) {
        setInputText(inputText ? `${inputText} ${transcript}` : transcript);
      }
    } else {
      start();
    }
  }, [isListening, stop, start, transcript, inputText, setInputText]);

  const handleTranslate = () => {
    const text = inputText.trim();
    if (!text) return;
    onTranslate(text);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Textarea
          placeholder="Type text to translate to sign language..."
          value={isListening ? `${inputText} ${transcript}`.trim() : inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={4}
          className="resize-none pr-12"
          disabled={isListening}
        />
        <div className="absolute bottom-2 right-2">
          <VoiceInputButton
            isListening={isListening}
            isSupported={speechSupported}
            onToggle={handleVoiceToggle}
          />
        </div>
      </div>

      {isListening && (
        <p className="text-sm text-muted-foreground animate-pulse">
          Listening... Speak now
        </p>
      )}

      <Button
        onClick={handleTranslate}
        disabled={!inputText.trim() || isTranslating}
        className="w-full"
      >
        {isTranslating ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Translating...
          </>
        ) : (
          <>
            <Languages className="mr-2 size-4" />
            Translate to Sign Language
          </>
        )}
      </Button>
    </div>
  );
}
