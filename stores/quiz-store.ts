import { create } from "zustand";

interface QuizQuestion {
  id: number;
  questionType: string;
  questionText: string;
  options: string[] | null;
  correctAnswer: string;
  signId: number | null;
}

interface QuizState {
  quizId: number | null;
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  answers: Record<number, string>;
  timeRemaining: number | null;
  isSubmitted: boolean;
  score: number | null;

  startQuiz: (
    quizId: number,
    questions: QuizQuestion[],
    timeLimit: number | null
  ) => void;
  answerQuestion: (questionId: number, answer: string) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  tick: () => void;
  submitQuiz: () => void;
  resetQuiz: () => void;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  quizId: null,
  questions: [],
  currentQuestionIndex: 0,
  answers: {},
  timeRemaining: null,
  isSubmitted: false,
  score: null,

  startQuiz: (quizId, questions, timeLimit) =>
    set({
      quizId,
      questions,
      currentQuestionIndex: 0,
      answers: {},
      timeRemaining: timeLimit,
      isSubmitted: false,
      score: null,
    }),

  answerQuestion: (questionId, answer) =>
    set((state) => ({
      answers: { ...state.answers, [questionId]: answer },
    })),

  nextQuestion: () => {
    const { currentQuestionIndex, questions } = get();
    if (currentQuestionIndex < questions.length - 1) {
      set({ currentQuestionIndex: currentQuestionIndex + 1 });
    }
  },

  previousQuestion: () => {
    const { currentQuestionIndex } = get();
    if (currentQuestionIndex > 0) {
      set({ currentQuestionIndex: currentQuestionIndex - 1 });
    }
  },

  tick: () => {
    const { timeRemaining } = get();
    if (timeRemaining !== null && timeRemaining > 0) {
      set({ timeRemaining: timeRemaining - 1 });
    }
  },

  submitQuiz: () => {
    const { questions, answers } = get();
    let correct = 0;
    for (const q of questions) {
      if (answers[q.id] === q.correctAnswer) correct++;
    }
    const score = Math.round((correct / questions.length) * 100);
    set({ isSubmitted: true, score });
  },

  resetQuiz: () =>
    set({
      quizId: null,
      questions: [],
      currentQuestionIndex: 0,
      answers: {},
      timeRemaining: null,
      isSubmitted: false,
      score: null,
    }),
}));
