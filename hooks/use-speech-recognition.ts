"use client";

import { useState, useRef, useCallback } from "react";
import {
  getDeepgramKey,
  createDeepgramSocket,
  getMicrophoneStream,
  mapLanguage,
  type DeepgramTranscriptEvent,
} from "@/lib/speech/deepgram";

export function useSpeechRecognition(language: string = "en-IN") {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

  // Deepgram works in all modern browsers (WebSocket + MediaRecorder)
  const isSupported =
    typeof window !== "undefined" &&
    typeof WebSocket !== "undefined" &&
    typeof navigator?.mediaDevices?.getUserMedia === "function";

  const cleanup = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    recorderRef.current = null;

    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "CloseStream" }));
      }
      wsRef.current.close();
    }
    wsRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    streamRef.current = null;
  }, []);

  const start = useCallback(async () => {
    if (!isSupported) {
      setError("Speech recognition not supported in this browser");
      return;
    }

    setError(null);
    setTranscript("");

    try {
      const apiKey = await getDeepgramKey();
      const stream = await getMicrophoneStream();
      streamRef.current = stream;

      const dgLang = mapLanguage(language);
      const ws = createDeepgramSocket(apiKey, {
        language: dgLang,
        interim_results: true,
        smart_format: true,
        punctuate: true,
      });
      wsRef.current = ws;

      ws.onopen = () => {
        setIsListening(true);

        const recorder = new MediaRecorder(stream, {
          mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
            ? "audio/webm;codecs=opus"
            : "audio/webm",
        });
        recorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
            ws.send(event.data);
          }
        };

        recorder.start(250);
      };

      ws.onmessage = (event) => {
        try {
          const data: DeepgramTranscriptEvent = JSON.parse(event.data);
          const alt = data.channel?.alternatives?.[0];
          if (alt?.transcript) {
            setTranscript(alt.transcript);
          }
        } catch {
          // Ignore non-JSON messages (metadata, etc.)
        }
      };

      ws.onerror = () => {
        setError("Connection to speech service failed");
        cleanup();
        setIsListening(false);
      };

      ws.onclose = () => {
        setIsListening(false);
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to start speech recognition";

      if (message.includes("Permission denied") || message.includes("NotAllowed")) {
        setError("Microphone permission denied");
      } else {
        setError(message);
      }
      setIsListening(false);
    }
  }, [language, isSupported, cleanup]);

  const stop = useCallback(() => {
    cleanup();
    setIsListening(false);
  }, [cleanup]);

  return {
    transcript,
    isListening,
    error,
    isSupported,
    start,
    stop,
    setTranscript,
  };
}
