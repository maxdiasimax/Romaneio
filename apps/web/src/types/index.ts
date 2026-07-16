export type UserRole = 'user' | 'admin';
export type PlanType = 'free' | 'pro' | 'premium';
export type DifficultyLevel = 'fácil' | 'médio' | 'difícil';
export type ExamBank =
  | 'ENEM'
  | 'OAB'
  | 'CESPE'
  | 'VUNESP'
  | 'FCC'
  | 'IBFC'
  | 'OTHER';
export type SimuladoStatus = 'draft' | 'in_progress' | 'completed';
export type FlashcardStatus = 'new' | 'learning' | 'mastered' | 'forgotten';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
}

export interface Question {
  id: string;
  subjectId: string;
  bank: ExamBank;
  title?: string;
  text: string;
  alternatives: string[];
  correctAlternative: number;
  explanation?: string;
  difficulty: DifficultyLevel;
  tags: string[];
  year?: number;
  sourceUrl?: string;
  aiGenerated: boolean;
  status: 'draft' | 'published' | 'archived';
  viewsCount: number;
  correctCount: number;
  wrongCount: number;
}

export interface UserQuestionResponse {
  id: string;
  userId: string;
  questionId: string;
  selectedAlternative?: number;
  isCorrect?: boolean;
  timeSpentSeconds?: number;
  attemptNumber: number;
  createdAt: string;
}

export interface Simulado {
  id: string;
  userId: string;
  title: string;
  description?: string;
  subjects: string[];
  difficulty?: DifficultyLevel;
  questionCount: number;
  timeLimitMinutes?: number;
  status: SimuladoStatus;
  score?: number;
  correctCount?: number;
  wrongCount?: number;
  createdAt: string;
  completedAt?: string;
}

export interface Flashcard {
  id: string;
  userId: string;
  questionId?: string;
  front: string;
  back: string;
  subjectId?: string;
  deckName?: string;
  status: FlashcardStatus;
  easeFactor: number;
  nextReviewAt?: string;
  reviewCount: number;
}

export interface UserStatistics {
  userId: string;
  totalQuestionsSolved: number;
  correctAnswers: number;
  wrongAnswers: number;
  accuracyPercentage: number;
  totalStudyMinutes: number;
  totalSimuladosCompleted: number;
  averageSimuladoScore?: number;
  streakDays: number;
  lastStudyDate?: string;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'inactive' | 'cancelled' | 'expired';
  startedAt: string;
  expiresAt?: string;
}

export interface Plan {
  id: string;
  name: PlanType;
  title: string;
  description?: string;
  price?: number;
  billingCycle?: 'monthly' | 'yearly';
  features: Record<string, any>;
}

export interface Payment {
  id: string;
  userId: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  method: 'pix' | 'boleto' | 'credit_card';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  paidAt?: string;
  createdAt: string;
}
