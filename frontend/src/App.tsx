import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Interview from './pages/Interview'
import Progress from './pages/Progress'

function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/interview/:sessionId" element={<Interview />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
