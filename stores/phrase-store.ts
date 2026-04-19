import { create } from "zustand";

interface PhraseState {
  isModelLoaded: boolean;
  isDetecting: boolean;
  currentPrediction: string | null;
  confidence: number;
  targetPhrase: string | null;
  isCorrect: boolean | null;
  consecutiveCorrect: number;
  totalAttempts: number;

  setModelLoaded: (loaded: boolean) => void;
  startDetection: () => void;
  stopDetection: () => void;
  setPrediction: (label: string, confidence: number) => void;
  clearPrediction: () => void;
  setTargetPhrase: (phrase: string) => void;
  checkAnswer: () => void;
  resetSession: () => void;
}

export const usePhraseStore = create<PhraseState>((set, get) => ({
  isModelLoaded: false,
  isDetecting: false,
  currentPrediction: null,
  confidence: 0,
  targetPhrase: null,
  isCorrect: null,
  consecutiveCorrect: 0,
  totalAttempts: 0,

  setModelLoaded: (loaded) => set({ isModelLoaded: loaded }),

  startDetection: () => set({ isDetecting: true }),

  stopDetection: () => set({ isDetecting: false }),

  setPrediction: (label, confidence) =>
    set({ currentPrediction: label, confidence }),

  clearPrediction: () =>
    set({ currentPrediction: null, confidence: 0, isCorrect: null }),

  setTargetPhrase: (phrase) =>
    set({ targetPhrase: phrase, isCorrect: null, currentPrediction: null }),

  checkAnswer: () => {
    const { currentPrediction, targetPhrase, consecutiveCorrect, totalAttempts } =
      get();
    if (!currentPrediction || !targetPhrase) return;

    const correct =
      currentPrediction.toLowerCase() === targetPhrase.toLowerCase();

    set({
      isCorrect: correct,
      consecutiveCorrect: correct ? consecutiveCorrect + 1 : 0,
      totalAttempts: totalAttempts + 1,
    });
  },

  resetSession: () =>
    set({
      currentPrediction: null,
      confidence: 0,
      targetPhrase: null,
      isCorrect: null,
      consecutiveCorrect: 0,
      totalAttempts: 0,
    }),
}));
