"use client";

import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VoiceInputButtonProps {
  isListening: boolean;
  isSupported: boolean;
  onToggle: () => void;
}

export function VoiceInputButton({
  isListening,
  isSupported,
  onToggle,
}: VoiceInputButtonProps) {
  if (!isSupported) return null;

  return (
    <Button
      variant={isListening ? "destructive" : "outline"}
      size="icon"
      onClick={onToggle}
      className={cn(isListening && "animate-pulse")}
      aria-label={isListening ? "Stop listening" : "Start voice input"}
    >
      {isListening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
    </Button>
  );
}
