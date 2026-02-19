export interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
}

// Type declarations for Web Speech API
interface SpeechRecognitionEventResult {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: { transcript: string; confidence: number };
}

interface SpeechRecognitionEventResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionEventResult;
}

interface SpeechRecognitionEventMap {
  result: { results: SpeechRecognitionEventResultList };
  end: Event;
  error: { error: string };
}

interface WebSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventMap["result"]) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionEventMap["error"]) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface WebSpeechRecognitionConstructor {
  new (): WebSpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: WebSpeechRecognitionConstructor;
    webkitSpeechRecognition?: WebSpeechRecognitionConstructor;
  }
}

export function isSupported(): boolean {
  return !!(
    typeof window !== "undefined" &&
    (window.SpeechRecognition || window.webkitSpeechRecognition)
  );
}

export function createRecognition(
  language: string = "en-IN",
  onResult: (result: SpeechRecognitionResult) => void,
  onEnd: () => void,
  onError: (error: string) => void
): WebSpeechRecognition | null {
  if (!isSupported()) {
    onError("Speech recognition not supported in this browser");
    return null;
  }

  const SpeechRecognitionAPI =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognitionAPI) return null;

  const recognition = new SpeechRecognitionAPI();

  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = language;

  recognition.onresult = (event) => {
    const last = event.results[event.results.length - 1];
    onResult({
      transcript: last[0].transcript,
      isFinal: last.isFinal,
    });
  };

  recognition.onend = onEnd;

  recognition.onerror = (event) => {
    switch (event.error) {
      case "not-allowed":
        onError("Microphone permission denied");
        break;
      case "no-speech":
        onError("No speech detected");
        break;
      default:
        onError(`Speech recognition error: ${event.error}`);
    }
  };

  return recognition;
}
