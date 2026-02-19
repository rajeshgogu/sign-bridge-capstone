import { create } from "zustand";

interface LearningSessionState {
  currentLessonId: number | null;
  currentSignIndex: number;
  totalSigns: number;
  learnedSignIds: Set<number>;
  isComplete: boolean;

  startLesson: (lessonId: number, totalSigns: number) => void;
  nextSign: () => void;
  previousSign: () => void;
  markSignLearned: (signId: number) => void;
  completeLesson: () => void;
  resetSession: () => void;
}

export const useLearningSessionStore = create<LearningSessionState>(
  (set, get) => ({
    currentLessonId: null,
    currentSignIndex: 0,
    totalSigns: 0,
    learnedSignIds: new Set(),
    isComplete: false,

    startLesson: (lessonId, totalSigns) =>
      set({
        currentLessonId: lessonId,
        currentSignIndex: 0,
        totalSigns,
        learnedSignIds: new Set(),
        isComplete: false,
      }),

    nextSign: () => {
      const { currentSignIndex, totalSigns } = get();
      if (currentSignIndex < totalSigns - 1) {
        set({ currentSignIndex: currentSignIndex + 1 });
      }
    },

    previousSign: () => {
      const { currentSignIndex } = get();
      if (currentSignIndex > 0) {
        set({ currentSignIndex: currentSignIndex - 1 });
      }
    },

    markSignLearned: (signId) => {
      const { learnedSignIds } = get();
      const updated = new Set(learnedSignIds);
      updated.add(signId);
      set({ learnedSignIds: updated });
    },

    completeLesson: () => set({ isComplete: true }),

    resetSession: () =>
      set({
        currentLessonId: null,
        currentSignIndex: 0,
        totalSigns: 0,
        learnedSignIds: new Set(),
        isComplete: false,
      }),
  })
);
