import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

export interface SessionStartRequestData {
  role: string
  jobDescription?: string
  resumeText?: string
  name: string
  email?: string
}

export interface SessionStartResponseData {
  session: any
  first_question: any
}

export interface NextQuestionResponseData {
  feedback: any
  next_question: any
  is_session_ended: boolean
}

export interface SessionEndResponseData {
  summary: string
}

export const startSession = async (data: SessionStartRequestData) => {
  const res = await api.post('/session/start', data)
  return res.data as SessionStartResponseData
}

export const submitAnswer = async (sessionId: string, data: { questionId: string; answerText: string }) => {
  const res = await api.post(`/session/${sessionId}/answer`, data)
  return res.data as NextQuestionResponseData
}

export const endSession = async (sessionId: string) => {
  const res = await api.post(`/session/${sessionId}/end`)
  return res.data as SessionEndResponseData
}

export const getSession = async (sessionId: string) => {
  const res = await api.get(`/session/${sessionId}`)
  return res.data
}

export const getUserProgress = async (userId: string) => {
  const res = await api.get(`/users/${userId}/progress`)
  return res.data
}
