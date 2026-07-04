import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { startSession } from '../services/api'

const ROLES = [
  'Software Engineer',
  'Data Analyst',
  'Product Manager',
  'Sales Representative',
  'Other',
]

export default function Home() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('Software Engineer')
  const [customRole, setCustomRole] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [resumeText, setResumeText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    if (!email.trim()) {
      setError('Email is required')
      return
    }
    setLoading(true)
    try {
      const effectiveRole = role === 'Other' ? customRole || 'General' : role
      const res = await startSession({
        name: name.trim(),
        email: email.trim(),
        role: effectiveRole,
        jobDescription: jobDescription.trim() || undefined,
        resumeText: resumeText.trim() || undefined,
      })
      navigate(`/interview/${res.session.id}`)
    } catch (err) {
      setError('Failed to start session. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-md p-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">AI Interview Practice Agent</h1>
        <p className="text-slate-600 mb-6">Master your next interview with AI-powered practice sessions.</p>
        {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Target Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            {role === 'Other' && (
              <input
                type="text"
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter custom role"
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Job Description (optional)</label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Paste the job description here..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Resume (optional)</label>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Paste your resume or key experience..."
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white rounded-lg py-3 font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Starting...' : 'Start Practice Session'}
          </button>
        </form>
        <div className="mt-6 text-center">
          <button onClick={() => navigate('/progress')} className="text-primary-600 hover:underline text-sm">
            View Progress Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
