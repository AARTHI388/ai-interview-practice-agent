import { ProgressData } from '../types'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface ProgressDashboardProps {
  data: ProgressData[]
}

export default function ProgressDashboard({ data }: ProgressDashboardProps) {
  const avg = data.length ? (data.reduce((a, b) => a + b.overall_score, 0) / data.length).toFixed(1) : '0'
  const best = data.length ? Math.max(...data.map((d) => d.overall_score)).toFixed(1) : '0'
  const chartData = data.map((d, i) => ({ name: `Session ${i + 1}`, score: d.overall_score }))

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900">{data.length}</div>
          <div className="text-sm text-slate-500">Sessions</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-600">{avg}</div>
          <div className="text-sm text-slate-500">Avg Score</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{best}</div>
          <div className="text-sm text-slate-500">Best Score</div>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 10]} />
            <Tooltip />
            <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
