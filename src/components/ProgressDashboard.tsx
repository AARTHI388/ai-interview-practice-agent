import React, { useState, useEffect } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from "recharts";
import { ArrowLeft, Trophy, Calendar, Sparkles, MessageSquare, Award, Star, ListCollapse } from "lucide-react";
import { motion } from "motion/react";
import { UserProgress, SessionProgressItem } from "../types";

interface ProgressDashboardProps {
  userId: string;
  onBack: () => void;
  onViewSessionTranscript: (id: string) => void;
}

export default function ProgressDashboard({
  userId,
  onBack,
  onViewSessionTranscript,
}: ProgressDashboardProps) {
  const [progressData, setProgressData] = useState<UserProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/users/${userId}/progress`)
      .then((res) => res.json())
      .then((data) => {
        setProgressData(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error loading progress:", err);
        setIsLoading(false);
      });
  }, [userId]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm font-medium text-gray-500">Retrieving historical performance records...</p>
      </div>
    );
  }

  // Calculate high-level KPIs
  const sessionsCount = progressData?.sessionsCount || 0;
  const answersCount = progressData?.answersCount || 0;
  
  const completedSessions = progressData?.sessionProgress || [];
  const averageScore = completedSessions.length > 0
    ? Math.round(completedSessions.reduce((acc, s) => acc + s.score, 0) / completedSessions.length)
    : 0;

  const highestScore = completedSessions.length > 0
    ? Math.max(...completedSessions.map((s) => s.score))
    : 0;

  // Prepare chart data format
  const chartData = completedSessions.map((s, idx) => ({
    name: `S-${idx + 1}`,
    Date: new Date(s.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    Score: s.score,
    Clarity: s.categories.clarity * 10,
    Structure: s.categories.structure * 10,
    Relevance: s.categories.relevance * 10,
    Technical: s.categories.technical_accuracy * 10,
    Role: s.role,
  }));

  // Average by dimension across all sessions
  const avgDimensions = {
    Clarity: 0,
    Structure: 0,
    Relevance: 0,
    Technical: 0,
  };

  if (completedSessions.length > 0) {
    completedSessions.forEach((s) => {
      avgDimensions.Clarity += s.categories.clarity * 10;
      avgDimensions.Structure += s.categories.structure * 10;
      avgDimensions.Relevance += s.categories.relevance * 10;
      avgDimensions.Technical += s.categories.technical_accuracy * 10;
    });

    avgDimensions.Clarity = Math.round(avgDimensions.Clarity / completedSessions.length);
    avgDimensions.Structure = Math.round(avgDimensions.Structure / completedSessions.length);
    avgDimensions.Relevance = Math.round(avgDimensions.Relevance / completedSessions.length);
    avgDimensions.Technical = Math.round(avgDimensions.Technical / completedSessions.length);
  }

  const dimensionChartData = [
    { name: "Clarity", Level: avgDimensions.Clarity, fill: "rgba(255, 255, 255, 0.85)" },
    { name: "STAR Structure", Level: avgDimensions.Structure, fill: "rgba(255, 255, 255, 0.70)" },
    { name: "Relevance", Level: avgDimensions.Relevance, fill: "rgba(255, 255, 255, 0.50)" },
    { name: "Tech Accuracy", Level: avgDimensions.Technical, fill: "rgba(255, 255, 255, 0.35)" },
  ];

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
      {/* Back Header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-white/50 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Setup Dashboard
        </button>
      </div>

      {/* Analytics Main Header */}
      <div className="mb-10 text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-serif italic text-white tracking-wide flex items-center justify-center sm:justify-start gap-2.5">
          <Trophy className="w-6 h-6 text-white/60" />
          Performance Analytics
        </h1>
        <p className="text-xs text-white/40 mt-2 max-w-xl leading-relaxed">
          Visual metrics representing overall clarity, structural STAR application, and depth criteria across all practice rounds.
        </p>
      </div>

      {sessionsCount === 0 ? (
        <div className="bg-[#0d0d0d] border border-white/10 rounded-xs p-12 text-center max-w-md mx-auto shadow-2xl">
          <div className="w-12 h-12 bg-white/5 rounded-xs flex items-center justify-center mx-auto mb-4 text-white/40">
            <Star className="w-5 h-5" />
          </div>
          <h2 className="font-serif italic text-white text-base">No session data found</h2>
          <p className="text-xs text-white/50 mt-2 leading-relaxed">
            Complete your first full structured practice session to unlock responsive growth metrics and scoring diagrams!
          </p>
          <button
            onClick={onBack}
            className="mt-6 px-5 py-2.5 bg-white hover:bg-white/90 text-black font-serif italic text-sm font-bold tracking-wide rounded-xs shadow-lg cursor-pointer"
          >
            Start Your First Practice
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* KPI Dashboard Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Sessions Finished", value: sessionsCount, desc: "Rounds completed", icon: Calendar },
              { label: "Answers Graded", value: answersCount, desc: "STAR submissions", icon: MessageSquare },
              { label: "Highest Score", value: `${highestScore}%`, desc: "Personal record", icon: Award },
              { label: "Average Grade", value: `${averageScore}%`, desc: "Practice competency", icon: Sparkles },
            ].map((kpi, idx) => (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-[#0d0d0d] border border-white/10 shadow-2xl rounded-xs p-5 flex flex-col justify-between"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-white/40 font-mono">
                    {kpi.label}
                  </span>
                  <div className="p-1.5 rounded-xs bg-white/5 text-white/60">
                    <kpi.icon className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-extrabold text-white font-mono">{kpi.value}</h3>
                  <p className="text-[9px] text-white/30 uppercase tracking-wider mt-1">{kpi.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Charts Area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Overall Score Trend Line Graph */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[#0d0d0d] border border-white/10 shadow-2xl rounded-xs p-5 sm:p-6"
            >
              <h3 className="text-[10px] uppercase tracking-[0.15em] text-white/40 mb-4 border-b border-white/5 pb-2.5 font-medium">
                Session Score Progress Trend
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} />
                    <Tooltip
                      contentStyle={{ background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "4px", color: "#fff", fontSize: "11px" }}
                      labelFormatter={(label) => `Session Number: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="Score"
                      stroke="#ffffff"
                      strokeWidth={2}
                      activeDot={{ r: 5, fill: "#ffffff", strokeWidth: 0 }}
                      dot={{ strokeWidth: 1.5, r: 3, stroke: "#0d0d0d", fill: "#ffffff" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Categorized Competency Bar Graph */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[#0d0d0d] border border-white/10 shadow-2xl rounded-xs p-5 sm:p-6"
            >
              <h3 className="text-[10px] uppercase tracking-[0.15em] text-white/40 mb-4 border-b border-white/5 pb-2.5 font-medium">
                Competency Breakdown (Average)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dimensionChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} />
                    <Tooltip
                      cursor={{ fill: "rgba(255,255,255,0.02)" }}
                      contentStyle={{ background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "4px", color: "#fff", fontSize: "11px" }}
                    />
                    <Bar dataKey="Level" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* Detailed Reports Log List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0d0d0d] border border-white/10 shadow-2xl rounded-xs p-6"
          >
            <h3 className="text-[10px] uppercase tracking-[0.15em] text-white/40 mb-4 flex items-center gap-2 border-b border-white/5 pb-3 font-medium">
              <ListCollapse className="w-4 h-4 text-white/30" />
              Comprehensive Attempt Log
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[9px] uppercase tracking-wider text-white/40 font-bold">
                    <th className="py-3 px-4">Role / Sector</th>
                    <th className="py-3 px-4">Completion Date</th>
                    <th className="py-3 px-4">Clarity</th>
                    <th className="py-3 px-4">Structure</th>
                    <th className="py-3 px-4">Tech Depth</th>
                    <th className="py-3 px-4">Total Grade</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {completedSessions.map((session) => (
                    <tr key={session.sessionId} className="hover:bg-white/[0.01] transition-colors text-xs text-white/60">
                      <td className="py-3.5 px-4 font-serif italic text-white/80 truncate max-w-[180px]">
                        {session.role}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-white/50">
                        {new Date(session.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-white/50">{session.categories.clarity * 10}%</td>
                      <td className="py-3.5 px-4 font-mono text-white/50">{session.categories.structure * 10}%</td>
                      <td className="py-3.5 px-4 font-mono text-white/50">{session.categories.technical_accuracy * 10}%</td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold px-2 py-1 bg-white/5 border border-white/10 text-white rounded-xs">
                          {session.score}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onViewSessionTranscript(session.sessionId)}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white font-mono rounded-xs text-[10px] uppercase tracking-wider border border-white/10 transition-all cursor-pointer"
                        >
                          Review Report Card
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
