export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Session {
  id: string;
  user_id: string;
  role: string;
  job_description: string;
  started_at: string;
  ended_at: string | null;
  overall_score: number | null;
  overall_feedback?: string;
  current_question_index: number;
  questions: string[];
}

export interface QuestionAsked {
  id: string;
  session_id: string;
  question_text: string;
  question_type: string;
  difficulty: string;
  asked_at: string;
}

export interface Answer {
  id: string;
  question_id: string;
  session_id: string;
  answer_text: string;
  score_json: {
    clarity: number;
    structure: number;
    relevance: number;
    technical_accuracy: number;
    overall: number;
  };
  feedback_text: string;
  created_at: string;
}

export interface TranscriptItem {
  question: QuestionAsked;
  answer: Answer | null;
}

export interface GradedFeedback {
  reasoning: string;
  clarity: number;
  structure: number;
  relevance: number;
  technical_accuracy: number;
  overall: number;
  feedback_text: string;
  suggested_star_rewrite: string;
}

export interface CurrentQuestion {
  id: string;
  text: string;
  index: number;
  total: number;
}

export interface SessionProgressItem {
  sessionId: string;
  role: string;
  date: string;
  score: number;
  categories: {
    clarity: number;
    structure: number;
    relevance: number;
    technical_accuracy: number;
    overall: number;
  };
}

export interface UserProgress {
  sessionsCount: number;
  answersCount: number;
  sessionProgress: SessionProgressItem[];
}
