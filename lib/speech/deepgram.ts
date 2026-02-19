const DEEPGRAM_WS_URL = "wss://api.deepgram.com/v1/listen";

export interface DeepgramTranscriptEvent {
  channel: {
    alternatives: { transcript: string; confidence: number }[];
  };
  is_final: boolean;
  speech_final: boolean;
}

export interface DeepgramOptions {
  language: string;
  model?: string;
  smart_format?: boolean;
  interim_results?: boolean;
  punctuate?: boolean;
  endpointing?: number;
}

/**
 * Fetches a Deepgram API key from our server-side route.
 */
export async function getDeepgramKey(): Promise<string> {
  const res = await fetch("/api/speech/deepgram-key");
  if (!res.ok) throw new Error("Failed to get Deepgram key");
  const data = await res.json();
  return data.key;
}

/**
 * Creates a Deepgram live transcription WebSocket connection.
 */
export function createDeepgramSocket(
  apiKey: string,
  options: DeepgramOptions
): WebSocket {
  const params = new URLSearchParams({
    model: options.model ?? "nova-3",
    language: options.language,
    smart_format: String(options.smart_format ?? true),
    interim_results: String(options.interim_results ?? true),
    punctuate: String(options.punctuate ?? true),
    endpointing: String(options.endpointing ?? 300),
    encoding: "linear16",
    sample_rate: "16000",
    channels: "1",
  });

  const ws = new WebSocket(`${DEEPGRAM_WS_URL}?${params}`, [
    "token",
    apiKey,
  ]);

  return ws;
}

/**
 * Maps language codes to Deepgram-compatible language codes.
 */
export function mapLanguage(lang: string): string {
  const map: Record<string, string> = {
    "en": "en",
    "en-IN": "en-IN",
    "hi": "hi",
    "hi-IN": "hi",
  };
  return map[lang] ?? "en";
}

/**
 * Requests microphone access and returns a MediaStream with 16kHz mono audio.
 */
export async function getMicrophoneStream(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    audio: {
      channelCount: 1,
      sampleRate: 16000,
      echoCancellation: true,
      noiseSuppression: true,
    },
  });
}
