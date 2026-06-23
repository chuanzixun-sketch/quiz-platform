export interface QuestionContent {
  type: 'single' | 'multiple' | 'true_false' | 'fill_blank' | 'short_answer';
  question: string;
  options?: string[];
  answer?: string | string[];
  analysis?: string;
  difficulty?: 1 | 2 | 3 | 4 | 5;
}

export interface Library {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  visibility: 'private' | 'public' | 'shared';
  question_count: number;
  tags?: string[];
  category?: string;
  is_ai_generated?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  library_id: string;
  question_content: QuestionContent;
  answer: string | string[];
  analysis?: string;
  difficulty: number;
  tags?: string[];
  category?: string;
  source?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Attempt {
  id: string;
  user_id: string;
  question_id: string;
  library_id: string;
  user_answer: string | string[];
  is_correct: boolean;
  score?: number;
  time_spent?: number;
  ai_graded?: boolean;
  ai_feedback?: string;
  created_at: string;
}

export interface WrongQuestion {
  id: string;
  user_id: string;
  question_id: string;
  library_id: string;
  wrong_count: number;
  last_wrong_at: string;
  mastered: boolean;
  review_count: number;
  next_review_at?: string;
  question?: Question;
}

export interface Favorite {
  id: string;
  user_id: string;
  question_id: string;
  library_id: string;
  created_at: string;
  question?: Question;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color?: string;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
}

export interface UserQuestionStatus {
  id: string;
  user_id: string;
  question_id: string;
  status: 'new' | 'learning' | 'reviewing' | 'mastered';
  confidence: number;
  last_reviewed_at?: string;
  review_count: number;
  correct_streak: number;
}

export interface StudySession {
  id: string;
  user_id: string;
  library_id?: string;
  questions_answered: number;
  correct_count: number;
  duration_minutes: number;
  date: string;
  created_at: string;
}

export interface AiSettings {
  id: string;
  user_id: string;
  provider: 'deepseek' | 'openai' | 'custom';
  api_key?: string;
  api_endpoint?: string;
  model: string;
  auto_grade: boolean;
  auto_explain: boolean;
  temperature: number;
  max_tokens: number;
  created_at: string;
  updated_at: string;
}

export type QuizMode = 'sequential' | 'random' | 'wrong_focused' | 'timed' | 'exam';

export interface QuizState {
  mode: QuizMode;
  questions: Question[];
  currentIndex: number;
  answers: Map<string, string | string[]>;
  isFinished: boolean;
  score: number;
  totalQuestions: number;
  timeLimit?: number;
  startTime?: string;
  shuffle?: boolean;
}

export interface AiExplainRequest {
  question: QuestionContent;
  userAnswer?: string | string[];
  correctAnswer?: string | string[];
}

export interface AiExplainResponse {
  explanation: string;
  keyPoints: string[];
  relatedKnowledge: string[];
  difficulty: number;
}

export interface AiGradeRequest {
  question: QuestionContent;
  userAnswer: string | string[];
}

export interface AiGradeResponse {
  score: number;
  isCorrect: boolean;
  feedback: string;
  analysis: string;
}

export interface LibraryStats {
  totalQuestions: number;
  attemptedQuestions: number;
  correctCount: number;
  accuracy: number;
  averageTime: number;
  masteredCount: number;
  wrongCount: number;
}
