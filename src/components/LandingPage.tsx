import React, { useState, useEffect } from "react";
import { Briefcase, FileText, Sparkles, User, Trophy, BarChart2, Plus, Play, History, Check } from "lucide-react";
import { motion } from "motion/react";

interface LandingPageProps {
  onStartSession: (config: {
    role: string;
    jobDescription: string;
    resumeText: string;
    difficulty: "easy" | "medium" | "hard";
  }) => void;
  onViewProgress: () => void;
  pastSessions: any[];
  onViewPastSession: (id: string) => void;
}

const PRESET_ROLES = [
  "Software Engineer",
  "Product Manager",
  "Data Analyst",
  "Sales Representative",
];

export default function LandingPage({
  onStartSession,
  onViewProgress,
  pastSessions,
  onViewPastSession,
}: LandingPageProps) {
  const [role, setRole] = useState("Software Engineer");
  const [customRole, setCustomRole] = useState("");
  const [isCustomRole, setIsCustomRole] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const selectedRole = isCustomRole ? customRole : role;
    onStartSession({
      role: selectedRole || "General Candidate",
      jobDescription,
      resumeText,
      difficulty,
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
      {/* Header Section */}
      <div className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 text-white/70 rounded-xs text-[10px] uppercase tracking-widest mb-4 font-mono"
        >
          <Sparkles className="w-3 h-3 text-white/60" />
          Real-Time RAG-Grounded AI Interviewing
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-4xl sm:text-5xl font-serif italic text-white mb-4 tracking-wide"
        >
          Interview Practice Agent
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-sm text-white/60 max-w-2xl mx-auto font-light leading-relaxed"
        >
          Practice job-specific interviews with an AI that retrieves matching questions, asks intelligent follow-ups, and evaluates you on the STAR method.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Setup Form */}
        <div className="md:col-span-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-[#0d0d0d] rounded-xs border border-white/10 shadow-2xl p-6 sm:p-8"
          >
            <h2 className="text-xs uppercase tracking-[0.2em] text-white/40 mb-6 flex items-center gap-2 border-b border-white/5 pb-3 font-medium">
              <Briefcase className="w-4 h-4 text-white/40" />
              Configure Your Practice Session
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Role Selection */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2 block font-medium">
                  Target Role
                </label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {PRESET_ROLES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setRole(r);
                        setIsCustomRole(false);
                      }}
                      className={`p-3.5 rounded-xs text-xs font-serif italic text-left transition-all ${
                        !isCustomRole && role === r
                          ? "bg-white text-black border border-white font-medium shadow-lg"
                          : "bg-white/5 border border-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setIsCustomRole(true)}
                    className={`p-3.5 rounded-xs text-xs font-serif italic text-left transition-all col-span-2 flex items-center justify-between ${
                      isCustomRole
                        ? "bg-white text-black border border-white font-medium shadow-lg"
                        : "bg-white/5 border border-white/5 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    <span>Custom Target Role</span>
                    <Plus className="w-3.5 h-3.5 text-white/40" />
                  </button>
                </div>

                {isCustomRole && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-2"
                  >
                    <input
                      type="text"
                      required
                      placeholder="e.g. Senior Frontend Architect, DevOps Lead, Marketing Associate..."
                      value={customRole}
                      onChange={(e) => setCustomRole(e.target.value)}
                      className="w-full bg-[#111111] border border-white/10 rounded-xs px-4 py-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors font-sans"
                    />
                  </motion.div>
                )}
              </div>

              {/* Difficulty level */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2 block font-medium">
                  Interview Difficulty
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["easy", "medium", "hard"] as const).map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setDifficulty(diff)}
                      className={`py-2 px-3 rounded-xs text-[10px] font-semibold uppercase tracking-widest border transition-all ${
                        difficulty === diff
                          ? "bg-white border-white text-black shadow-lg font-bold"
                          : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* Job Description Pasting */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1 flex items-center justify-between">
                  <span>Job Description (Optional but Recommended)</span>
                  <span className="text-[9px] text-white/30 font-normal normal-case font-mono">Grounds AI question generation</span>
                </label>
                <div className="relative">
                  <textarea
                    rows={4}
                    placeholder="Paste target job description details here to enable highly specific, tailored questions..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="w-full bg-[#111111] border border-white/10 rounded-xs px-4 py-3 pr-10 text-xs text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors resize-none font-sans leading-relaxed"
                  />
                  <FileText className="absolute right-3 top-3.5 w-4 h-4 text-white/20 pointer-events-none" />
                </div>
              </div>

              {/* Resume text pasting */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1 flex items-center justify-between">
                  <span>Your Resume / Experience (Optional)</span>
                  <span className="text-[9px] text-white/30 font-normal normal-case font-mono">Avoids repeating details you already possess</span>
                </label>
                <div className="relative">
                  <textarea
                    rows={4}
                    placeholder="Paste your CV text or brief highlights of your work history to customize adaptive checks..."
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    className="w-full bg-[#111111] border border-white/10 rounded-xs px-4 py-3 pr-10 text-xs text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors resize-none font-sans leading-relaxed"
                  />
                  <User className="absolute right-3 top-3.5 w-4 h-4 text-white/20 pointer-events-none" />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-white hover:bg-white/90 text-[#0a0a0a] rounded-xs font-serif italic text-sm font-bold tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      Generating Customized RAG Questions...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      Begin Practice Session
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>

        {/* Sidebar / Past Practice History */}
        <div className="space-y-6">
          {/* Quick Stats shortcut */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-[#0d0d0d] border border-white/10 rounded-xs p-6 shadow-2xl flex flex-col justify-between h-[180px]"
          >
            <div>
              <h3 className="text-sm font-serif italic mb-1 text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-white/60" />
                Track Progress
              </h3>
              <p className="text-[11px] text-white/50 leading-relaxed font-light mt-1">
                Monitor your STAR structural improvements and score trends over multiple attempts.
              </p>
            </div>
            <button
              onClick={onViewProgress}
              className="mt-4 px-4 py-2.5 bg-white text-black text-[11px] uppercase tracking-widest font-bold rounded-xs flex items-center justify-center gap-2 hover:bg-white/90 transition-all cursor-pointer"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Performance Analytics
            </button>
          </motion.div>

          {/* Past Sessions List */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-[#0d0d0d]/50 border border-white/10 rounded-xs shadow-2xl p-6"
          >
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-4 flex items-center gap-2 border-b border-white/5 pb-3">
              <History className="w-3.5 h-3.5 text-white/30" />
              Practice History Logs
            </h3>

            {pastSessions.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-xs text-white/40 font-light">No past practice logs yet.</p>
                <p className="text-[10px] text-white/30 font-mono mt-1">Completed sessions will appear here.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {pastSessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onViewPastSession(s.id)}
                    className="w-full text-left p-3 rounded-xs border border-white/5 bg-white/[0.01] hover:bg-white/5 hover:border-white/10 transition-all flex justify-between items-center group cursor-pointer"
                  >
                    <div className="truncate pr-2">
                      <p className="text-xs font-serif italic text-white/80 group-hover:text-white truncate">
                        {s.role}
                      </p>
                      <p className="text-[9px] text-white/40 uppercase tracking-wider mt-0.5">
                        {new Date(s.started_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    {s.overall_score !== null && (
                      <span className="flex-shrink-0 text-xs font-mono px-2 py-1 bg-white/10 border border-white/10 text-white rounded-xs">
                        {s.overall_score}%
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
