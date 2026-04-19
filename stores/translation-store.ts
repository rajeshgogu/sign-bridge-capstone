import { create } from "zustand";

export interface TranslationSign {
  id: number | string;
  name: string;
  imageUrl: string | null;
  gifUrl: string | null;
  instructions?: string;
  isPhrase?: boolean;
}

interface TranslationState {
  inputText: string;
  isListening: boolean;
  signSequence: TranslationSign[];
  isTranslating: boolean;
  currentSignIndex: number;
  isPlaying: boolean;
  playbackSpeed: number;

  setInputText: (text: string) => void;
  setListening: (listening: boolean) => void;
  setSignSequence: (signs: TranslationSign[]) => void;
  setTranslating: (translating: boolean) => void;
  play: () => void;
  pause: () => void;
  nextSign: () => void;
  setPlaybackSpeed: (speed: number) => void;
  reset: () => void;
}

export const useTranslationStore = create<TranslationState>((set, get) => ({
  inputText: "",
  isListening: false,
  signSequence: [],
  isTranslating: false,
  currentSignIndex: 0,
  isPlaying: false,
  playbackSpeed: 1,

  setInputText: (text) => set({ inputText: text }),
  setListening: (listening) => set({ isListening: listening }),
  setSignSequence: (signs) =>
    set({ signSequence: signs, currentSignIndex: 0, isPlaying: false }),
  setTranslating: (translating) => set({ isTranslating: translating }),

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),

  nextSign: () => {
    const { currentSignIndex, signSequence } = get();
    if (currentSignIndex < signSequence.length - 1) {
      set({ currentSignIndex: currentSignIndex + 1 });
    } else {
      set({ isPlaying: false, currentSignIndex: 0 });
    }
  },

  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

  reset: () =>
    set({
      inputText: "",
      signSequence: [],
      isTranslating: false,
      currentSignIndex: 0,
      isPlaying: false,
    }),
}));
