import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { submitAnswer, endSession, getSession } from '../services/api'
import FeedbackCard from '../components/FeedbackCard'

interface Message {
  role: 'interviewer' | 'user'
  text: string
  timestamp: number
}

export default function Interview() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<any>(null)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [sessionEnded, setSessionEnded] = useState(false)
  const [summary, setSummary] = useState('')
  const [questionCount, setQuestionCount] = useState(0)

  useEffect(() => {
    if (!sessionId) return
    (async () => {
      try {
        const data = await getSession(sessionId)
        const questions = data.questions || []
        const lastQ = questions[questions.length - 1]
        if (lastQ && !messages.length) {
          setCurrentQuestion(lastQ)
          setMessages([{ role: 'interviewer', text: lastQ.question_text, timestamp: Date.now() }])
        }
      } catch (e) {
        console.error(e)
      }
    })()
  }, [sessionId])

  const handleSend = async () => {
    if (!sessionId || !answer.trim() || !currentQuestion) return
    setLoading(true)
    setFeedback(null)
    const userMsg: Message = { role: 'user', text: answer.trim(), timestamp: Date.now() }
    setMessages((prev) => [...prev, userMsg])
    try {
      const res = await submitAnswer(sessionId, { questionId: currentQuestion.id, answerText: answer.trim() })
      if (res.is_session_ended) {
        setSessionEnded(true)
        const endRes = await endSession(sessionId)
        setSummary(endRes.summary)
      } else if (res.feedback) {
        setFeedback(res.feedback)
      }
      if (res.next_question) {
        setCurrentQuestion(res.next_question)
        setMessages((prev) => [...prev, { role: 'interviewer', text: res.next_question.question_text, timestamp: Date.now() }])
        setQuestionCount((c) => c + 1)
      }
      setAnswer('')
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Interview Session</h1>
        <div className="space-x-3">
          <button onClick={() => navigate('/progress')} className="text-sm text-primary-600 hover:underline">Progress</button>
          <button onClick={() => navigate('/')} className="text-sm text-slate-600 hover:underline">Home</button>
        </div>
      </header>
      <div className="max-w-3xl mx-auto p-4">
        {!sessionEnded ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="mb-4">
              <div className="text-xs font-medium text-slate-500 mb-1">Question {questionCount + 1}</div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-primary-600 h-2 rounded-full transition-all" style={{ width: `${Math.min((questionCount + 1) * 20, 100)}%` }} />
              </div>
            </div>
            <div className="space-y-4 mb-6">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg px-4 py-2 ${m.role === 'user' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && <div className="text-sm text-slate-500">Thinking...</div>}
            </div>
            {feedback && currentQuestion && (
              <FeedbackCard feedback={feedback} />
            )}
            <div className="mt-6">
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Type your answer here..."
              />
              <div className="mt-3 flex justify-between items-center">
                <button
                  onClick={handleSend}
                  disabled={loading || !answer.trim()}
                  className="bg-primary-600 text-white rounded-lg px-6 py-2 font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Submitting...' : 'Submit Answer'}
                </button>
                <button onClick={() => navigate('/')} className="text-sm text-slate-500 hover:text-slate-700">Exit Session</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Session Summary</h2>
            <div className="prose prose-slate max-w-none whitespace-pre-wrap text-slate-700 mb-6">{summary}</div>
            <button onClick={() => navigate('/')} className="bg-primary-600 text-white rounded-lg px-6 py-2 font-medium hover:bg-primary-700">Back to Home</button>
          </div>
        )}
      </div>
    </div>
  )
}
