import { create } from "zustand";

interface GestureState {
  isModelLoaded: boolean;
  isDetecting: boolean;
  currentPrediction: string | null;
  confidence: number;
  targetSign: string | null;
  isCorrect: boolean | null;
  consecutiveCorrect: number;
  totalAttempts: number;

  setModelLoaded: (loaded: boolean) => void;
  startDetection: () => void;
  stopDetection: () => void;
  setPrediction: (label: string, confidence: number) => void;
  clearPrediction: () => void;
  setTargetSign: (sign: string) => void;
  checkAnswer: () => void;
  resetSession: () => void;
}

export const useGestureStore = create<GestureState>((set, get) => ({
  isModelLoaded: false,
  isDetecting: false,
  currentPrediction: null,
  confidence: 0,
  targetSign: null,
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

  setTargetSign: (sign) =>
    set({ targetSign: sign, isCorrect: null, currentPrediction: null }),

  checkAnswer: () => {
    const { currentPrediction, targetSign, consecutiveCorrect, totalAttempts } =
      get();
    if (!currentPrediction || !targetSign) return;

    const correct =
      currentPrediction.toLowerCase() === targetSign.toLowerCase();

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
      targetSign: null,
      isCorrect: null,
      consecutiveCorrect: 0,
      totalAttempts: 0,
    }),
}));
