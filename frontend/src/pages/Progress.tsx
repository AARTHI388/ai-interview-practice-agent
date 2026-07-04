import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUserProgress } from '../services/api'
import ProgressDashboard from '../components/ProgressDashboard'
import { ProgressData } from '../types'

export default function Progress() {
  const [userId, setUserId] = useState('1')
  const [data, setData] = useState<ProgressData[]>([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const loadProgress = async () => {
    setLoading(true)
    try {
      const res = await getUserProgress(userId)
      const sessions = res.sessions || []
      setData(sessions.map((s: any) => ({ session_date: s.recorded_at, overall_score: s.score })))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Progress Dashboard</h1>
        <div className="space-x-3">
          <button onClick={() => navigate('/')} className="text-sm text-primary-600 hover:underline">Home</button>
        </div>
      </header>
      <div className="max-w-3xl mx-auto p-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-1">User ID</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter user ID"
            />
            <button onClick={loadProgress} className="bg-primary-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-primary-700">Load</button>
          </div>
        </div>
        {loading ? (
          <div className="text-center text-slate-500">Loading...</div>
        ) : data.length > 0 ? (
          <ProgressDashboard data={data} />
        ) : (
          <div className="text-center text-slate-500">No progress data available yet.</div>
        )}
      </div>
    </div>
  )
}
