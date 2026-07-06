import React, { useState, useEffect } from "react";
import LandingPage from "./components/LandingPage";
import InterviewScreen from "./components/InterviewScreen";
import SessionReportCard from "./components/SessionReportCard";
import ProgressDashboard from "./components/ProgressDashboard";
import { CurrentQuestion, GradedFeedback } from "./types";
import { Sparkles, Trophy, BookOpen, BarChart2, Activity } from "lucide-react";
import { motion } from "motion/react";

type AppView = "setup" | "interview" | "report" | "analytics";

export default function App() {
  const [view, setView] = useState<AppView>("setup");
  const [role, setRole] = useState("Software Engineer");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | string>("medium");
  
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestion | null>(null);
  const [pastSessions, setPastSessions] = useState<any[]>([]);

  // Load past sessions list
  const loadPastSessions = () => {
    fetch("/api/users/default-user/progress")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.sessionProgress) {
          // Map to correct display structure
          const formatted = data.sessionProgress.map((item: any) => ({
            id: item.sessionId,
            role: item.role,
            started_at: item.date,
            overall_score: item.score,
          }));
          setPastSessions(formatted);
        }
      })
      .catch((err) => console.error("Error loading past sessions:", err));
  };

  useEffect(() => {
    loadPastSessions();
  }, []);

  // Handler to start a session
  const handleStartSession = async (config: {
    role: string;
    jobDescription: string;
    resumeText: string;
    difficulty: "easy" | "medium" | "hard";
  }) => {
    try {
      const response = await fetch("/api/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setRole(config.role);
      setDifficulty(config.difficulty);
      setActiveSessionId(data.session.id);
      setCurrentQuestion(data.currentQuestion);
      setView("interview");
    } catch (err: any) {
      console.error("Failed to start session:", err);
      alert(err.message || "An error occurred while starting the session.");
    }
  };

  // Submit Answer to Express server
  const handleSubmitAnswer = async (
    answerText: string,
    followUpCount: number
  ): Promise<{
    feedback: GradedFeedback;
    nextQuestion: CurrentQuestion | null;
    isFollowUp: boolean;
    followUpCount: number;
    isEnded: boolean;
  }> => {
    if (!activeSessionId || !currentQuestion) {
      throw new Error("No active interview session");
    }

    const response = await fetch(`/api/session/${activeSessionId}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answerText,
        questionId: currentQuestion.id,
        followUpCount,
      }),
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }

    // Cache next question details so we can progress when user clicks Next
    if (data.nextQuestion) {
      setCurrentQuestion(data.nextQuestion);
    }

    return {
      feedback: data.feedback,
      nextQuestion: data.nextQuestion,
      isFollowUp: data.isFollowUp,
      followUpCount: data.followUpCount,
      isEnded: data.isEnded,
    };
  };

  // Compile final summary report card
  const handleFinishSession = async () => {
    if (!activeSessionId) return;

    try {
      const response = await fetch(`/api/session/${activeSessionId}/end`, {
        method: "POST",
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      // Reload historical completed lists
      loadPastSessions();
      setView("report");
    } catch (err) {
      console.error("Error finalizing session:", err);
      setView("report");
    }
  };

  const handleOpenPastSession = (id: string) => {
    setActiveSessionId(id);
    setView("report");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0] flex flex-col font-sans antialiased selection:bg-white selection:text-black">
      {/* Navigation Header */}
      <nav className="bg-[#0d0d0d] border-b border-white/10 py-4 px-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button
            onClick={() => setView("setup")}
            className="flex items-center gap-3 font-medium text-white tracking-wide hover:opacity-90 cursor-pointer text-left"
          >
            <div className="w-8 h-8 bg-white flex items-center justify-center rounded-xs transition-transform hover:scale-105">
              <div className="w-4 h-4 border-2 border-[#0a0a0a]"></div>
            </div>
            <span className="font-serif italic text-xl tracking-wide">STARPrep</span>
          </button>
          
          <div className="flex gap-6 items-center">
            <button
              onClick={() => setView("setup")}
              className={`text-[11px] uppercase tracking-widest transition-all cursor-pointer ${
                view === "setup"
                  ? "text-white border-b border-white/60 pb-1"
                  : "text-white/60 hover:text-white pb-1 border-b border-transparent"
              }`}
            >
              Practice Board
            </button>
            <button
              onClick={() => setView("analytics")}
              className={`text-[11px] uppercase tracking-widest transition-all flex items-center gap-1 cursor-pointer ${
                view === "analytics"
                  ? "text-white border-b border-white/60 pb-1"
                  : "text-white/60 hover:text-white pb-1 border-b border-transparent"
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-white/80" />
              Progress
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container workspace */}
      <main className="flex-1 pb-16">
        {view === "setup" && (
          <LandingPage
            onStartSession={handleStartSession}
            onViewProgress={() => setView("analytics")}
            pastSessions={pastSessions}
            onViewPastSession={handleOpenPastSession}
          />
        )}

        {view === "interview" && currentQuestion && (
          <InterviewScreen
            role={role}
            difficulty={difficulty}
            currentQuestion={currentQuestion}
            onSubmitAnswer={handleSubmitAnswer}
            onFinishSession={handleFinishSession}
          />
        )}

        {view === "report" && activeSessionId && (
          <SessionReportCard
            sessionId={activeSessionId}
            onBack={() => {
              setActiveSessionId(null);
              setCurrentQuestion(null);
              setView("setup");
            }}
            onViewAnalytics={() => setView("analytics")}
          />
        )}

        {view === "analytics" && (
          <ProgressDashboard
            userId="default-user"
            onBack={() => setView("setup")}
            onViewSessionTranscript={handleOpenPastSession}
          />
        )}
      </main>

      {/* Footer credits block (Humble design, no slop) */}
      <footer className="bg-[#0d0d0d] border-t border-white/10 py-6 px-6 text-center text-[10px] text-white/40 uppercase tracking-widest">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <span>STARPrep Interview Practice Agent • Real-time STAR evaluation.</span>
          <span>Google AI Studio Build Integration</span>
        </div>
      </footer>
    </div>
  );
}
