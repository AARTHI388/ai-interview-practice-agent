import { FeedbackData } from '../types'

interface FeedbackCardProps {
  feedback: FeedbackData
}

export default function FeedbackCard({ feedback }: FeedbackCardProps) {
  const { scores, strengths, weaknesses, improvement_tips } = feedback
  const scoreColor = (v: number) => {
    if (v >= 7) return 'text-green-600'
    if (v >= 4) return 'text-yellow-600'
    return 'text-red-600'
  }
  const bgColor = (v: number) => {
    if (v >= 7) return 'bg-green-100'
    if (v >= 4) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Feedback</h3>
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Clarity', value: scores.clarity },
          { label: 'Structure', value: scores.structure },
          { label: 'Relevance', value: scores.relevance },
          { label: 'Tech Accuracy', value: scores.technical_accuracy },
          { label: 'Overall', value: scores.overall },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <div className={`text-2xl font-bold ${scoreColor(s.value)}`}>{s.value.toFixed(1)}</div>
            <div className="text-xs text-slate-500">{s.label}</div>
            <div className={`mt-1 text-xs px-2 py-1 rounded ${bgColor(s.value)} ${scoreColor(s.value)}`}>{s.value >= 7 ? 'Strong' : s.value >= 4 ? 'Needs Work' : 'Weak'}</div>
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <h4 className="font-medium text-slate-900 mb-1">Strengths</h4>
          <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
            {strengths.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
        <div>
          <h4 className="font-medium text-slate-900 mb-1">Weaknesses</h4>
          <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
            {weaknesses.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
        <div>
          <h4 className="font-medium text-slate-900 mb-1">Improvement Tips</h4>
          <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
            {improvement_tips.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </div>
      </div>
    </div>
  )
}
