export interface User {
  id: string
  name: string
  email: string
  created_at: string
}

export interface Session {
  id: string
  user_id: string
  role: string
  job_description: string | null
  started_at: string
  ended_at: string | null
  overall_score: number | null
}

export interface QuestionAsked {
  id: string
  session_id: string
  question_text: string
  question_type: string
  difficulty: string
  order_index: number
  created_at: string
}

export interface Answer {
  id: string
  question_id: string
  answer_text: string
  score_json: string | null
  feedback_text: string | null
  created_at: string
}

export interface FeedbackData {
  scores: {
    clarity: number
    structure: number
    relevance: number
    technical_accuracy: number
    overall: number
  }
  strengths: string[]
  weaknesses: string[]
  improvement_tips: string[]
}

export interface ProgressData {
  session_date: string
  overall_score: number
}

export interface SessionStartResponse {
  session: Session
  first_question: QuestionAsked | null
}

export interface NextQuestionResponse {
  feedback: FeedbackData | null
  next_question: QuestionAsked | null
  is_session_ended: boolean
}

export interface SessionEndResponse {
  summary: string
}
