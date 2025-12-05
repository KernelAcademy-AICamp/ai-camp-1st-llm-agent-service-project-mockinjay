export interface UserProfile {
  id: string;
  username: string;
  email: string;
  nickname: string;
  profileImage: string;
  diseaseStage: string;
  createdAt: string;
}

export interface HealthProfile {
  userId: string;
  diseaseStage: string;
  eGFR: number;
  dialysisType: string;
  dietaryRestrictions: string[];
}

export interface QuizStats {
  totalQuizzes: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number;
  streak: number;
}

export interface BookmarkedPaper {
  id: string;
  pmid?: string;
  paperId: string; // Primary identifier (PMID)
  userId: string;
  title: string;
  authors?: string[];
  journal: string;
  pubDate?: string;
  year?: number;
  abstract?: string;
  url?: string;
  tags?: string[];
  notes?: string;
  bookmarkedAt: string;
  createdAt?: string;
}

export interface UserSettings {
  notifications: boolean;
  language: string;
  theme: string;
}
