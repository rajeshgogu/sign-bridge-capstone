export type Difficulty = "beginner" | "intermediate" | "advanced";

export type LessonStatus = "not_started" | "in_progress" | "completed";

export type ActivityType =
  | "lesson_started"
  | "lesson_completed"
  | "quiz_completed"
  | "practice_session"
  | "sign_learned";

export type QuizQuestionType =
  | "image_to_text"
  | "text_to_image"
  | "gesture"
  | "video_to_text";

export type QuizType = "multiple_choice" | "gesture" | "mixed";

export interface SignData {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  instructions: string | null;
  imageUrl: string | null;
  gifUrl: string | null;
  videoUrl: string | null;
  category: string | null;
  hindiText: string | null;
  englishText: string | null;
  tags: string[] | null;
  handShape: string | null;
  sortOrder: number | null;
}

export interface CategoryWithProgress {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  iconName: string | null;
  color: string | null;
  totalLessons: number | null;
  completedLessons: number;
  completionPercentage: number;
}

export interface LessonWithSigns {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  difficulty: string;
  estimatedMinutes: number | null;
  signs: SignData[];
  userProgress?: {
    status: string;
    completedSigns: number;
    totalSigns: number;
    completionPercentage: number;
  };
}

export interface DashboardStats {
  signsLearned: number;
  totalSigns: number;
  currentStreak: number;
  longestStreak: number;
  quizzesCompleted: number;
  overallProgress: number;
}

export interface QuizWithQuestions {
  id: number;
  title: string;
  description: string | null;
  difficulty: string;
  questionCount: number | null;
  timeLimitSeconds: number | null;
  type: string;
  questions: {
    id: number;
    questionType: string;
    questionText: string;
    options: string[] | null;
    correctAnswer: string;
    signId: number | null;
    sign?: SignData;
  }[];
}

export interface QuizResult {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeTakenSeconds: number | null;
  answers: { questionId: number; answer: string; correct: boolean }[];
}
