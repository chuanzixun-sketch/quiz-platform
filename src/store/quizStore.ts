import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Question, QuizMode, QuizState } from '@/types';

interface QuizStore {
  // Quiz state
  quizState: QuizState;
  isActive: boolean;

  // Actions
  startQuiz: (questions: Question[], mode: QuizMode, timeLimit?: number, shuffle?: boolean) => void;
  answerQuestion: (questionId: string, answer: string | string[]) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  finishQuiz: () => void;
  resetQuiz: () => void;
  setTimeLimit: (minutes: number) => void;

  // Stats
  getProgress: () => { answered: number; total: number; percentage: number };
  getScore: () => number;
}

const initialQuizState: QuizState = {
  mode: 'sequential',
  questions: [],
  currentIndex: 0,
  answers: new Map(),
  isFinished: false,
  score: 0,
  totalQuestions: 0,
};

export const useQuizStore = create<QuizStore>()(
  persist(
    (set, get) => ({
      quizState: initialQuizState,
      isActive: false,

      startQuiz: (questions, mode, timeLimit, shuffle) => {
        let processedQuestions = [...questions];
        if (shuffle) {
          processedQuestions = processedQuestions.sort(() => Math.random() - 0.5);
        }

        set({
          isActive: true,
          quizState: {
            mode,
            questions: processedQuestions,
            currentIndex: 0,
            answers: new Map(),
            isFinished: false,
            score: 0,
            totalQuestions: processedQuestions.length,
            timeLimit,
            startTime: new Date().toISOString(),
            shuffle,
          },
        });
      },

      answerQuestion: (questionId, answer) => {
        const { quizState } = get();
        const newAnswers = new Map(quizState.answers);
        newAnswers.set(questionId, answer);
        set({
          quizState: { ...quizState, answers: newAnswers },
        });
      },

      nextQuestion: () => {
        const { quizState } = get();
        if (quizState.currentIndex < quizState.questions.length - 1) {
          set({
            quizState: {
              ...quizState,
              currentIndex: quizState.currentIndex + 1,
            },
          });
        }
      },

      prevQuestion: () => {
        const { quizState } = get();
        if (quizState.currentIndex > 0) {
          set({
            quizState: {
              ...quizState,
              currentIndex: quizState.currentIndex - 1,
            },
          });
        }
      },

      finishQuiz: () => {
        const { quizState } = get();
        let score = 0;
        quizState.questions.forEach((q) => {
          const userAnswer = quizState.answers.get(q.id);
          if (userAnswer) {
            const correctAnswer = q.answer;
            if (Array.isArray(correctAnswer) && Array.isArray(userAnswer)) {
              const sortedCorrect = [...correctAnswer].sort();
              const sortedUser = [...userAnswer].sort();
              if (
                sortedCorrect.length === sortedUser.length &&
                sortedCorrect.every((v, i) => v === sortedUser[i])
              ) {
                score++;
              }
            } else if (correctAnswer === userAnswer) {
              score++;
            }
          }
        });

        set({
          quizState: {
            ...quizState,
            isFinished: true,
            score,
          },
          isActive: false,
        });
      },

      resetQuiz: () => {
        set({
          quizState: initialQuizState,
          isActive: false,
        });
      },

      setTimeLimit: (minutes) => {
        const { quizState } = get();
        set({
          quizState: { ...quizState, timeLimit: minutes },
        });
      },

      getProgress: () => {
        const { quizState } = get();
        const answered = quizState.answers.size;
        const total = quizState.totalQuestions;
        return {
          answered,
          total,
          percentage: total > 0 ? (answered / total) * 100 : 0,
        };
      },

      getScore: () => {
        return get().quizState.score;
      },
    }),
    {
      name: 'quiz-storage',
      partialize: (state) => ({
        quizState: {
          ...state.quizState,
          answers: Array.from(state.quizState.answers.entries()),
        },
      }),
      merge: (persisted: any, current) => ({
        ...current,
        quizState: {
          ...current.quizState,
          ...persisted.quizState,
          answers: persisted.quizState?.answers
            ? new Map(persisted.quizState.answers)
            : new Map(),
        },
      }),
    }
  )
);
