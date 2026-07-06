import React, { useState, useEffect } from "react";
import { ArrowLeft, BookOpen, ChevronDown, ChevronUp, Star, Award, CheckCircle, FileText, BarChart2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { TranscriptItem } from "../types";

// Import simple markdown or render custom parser to guarantee flawless parsing without package weight
function CustomMarkdown({ text }: { text: string }) {
  if (!text) return null;
  // Parse simple bullet points and headers
  const lines = text.split("\n");
  return (
    <div className="space-y-3 font-sans text-xs text-white/70 leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("###")) {
          return <h4 key={idx} className="text-sm font-serif italic text-white mt-5 mb-2">{trimmed.replace("###", "").trim()}</h4>;
        }
        if (trimmed.startsWith("##")) {
          return <h3 key={idx} className="text-base font-serif italic text-white mt-6 mb-3 border-b border-white/5 pb-1">{trimmed.replace("##", "").trim()}</h3>;
        }
        if (trimmed.startsWith("#")) {
          return <h2 key={idx} className="text-lg font-serif italic text-white mt-8 mb-4">{trimmed.replace("#", "").trim()}</h2>;
        }
        if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
          return (
            <ul key={idx} className="list-disc pl-5 space-y-1 text-white/60">
              <li>{trimmed.substring(1).trim()}</li>
            </ul>
          );
        }
        if (/^\d+\./.test(trimmed)) {
          return (
            <ol key={idx} className="list-decimal pl-5 space-y-1 text-white/60">
              <li>{trimmed.replace(/^\d+\./, "").trim()}</li>
            </ol>
          );
        }
        if (trimmed === "---") {
          return <hr key={idx} className="border-white/5 my-4" />;
        }
        return trimmed ? <p key={idx}>{trimmed}</p> : <div key={idx} className="h-2"></div>;
      })}
    </div>
  );
}

interface SessionReportCardProps {
  sessionId: string;
  onBack: () => void;
  onViewAnalytics: () => void;
}

export default function SessionReportCard({
  sessionId,
  onBack,
  onViewAnalytics,
}: SessionReportCardProps) {
  const [session, setSession] = useState<any>(null);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/session/${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        setSession(data.session);
        setTranscript(data.transcript);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error loading session report:", err);
        setIsLoading(false);
      });
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-xs font-mono text-white/50">Compiling overall practice feedback report card...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-white/50 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Setup Dashboard
        </button>
        <button
          onClick={onViewAnalytics}
          className="px-4 py-2.5 bg-white hover:bg-white/90 text-black font-bold text-[10px] uppercase tracking-widest rounded-xs shadow-lg flex items-center gap-1.5 cursor-pointer"
        >
          <BarChart2 className="w-3.5 h-3.5" />
          Progress Analytics
        </button>
      </div>

      <div className="space-y-8">
        {/* Banner with Final Grade */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#0d0d0d] border border-white/10 rounded-xs p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/[0.01] rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="space-y-3 text-center md:text-left max-w-lg">
            <span className="text-[9px] uppercase font-bold tracking-widest bg-white/5 border border-white/10 text-white/80 px-3 py-1 rounded-xs">
              Session Completed Successfully
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif italic text-white tracking-wide mt-2">
              Overall Practice Report
            </h1>
            <p className="text-xs text-white/40">
              Target Role: <strong className="text-white font-medium">{session?.role}</strong> | Practice date: {new Date(session?.started_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>

          <div className="flex flex-col items-center flex-shrink-0 bg-white/5 border border-white/10 p-5 rounded-xs w-full sm:w-40 text-center shadow-lg">
            <span className="text-[10px] uppercase font-bold tracking-widest text-white/60 mb-1">Final Grade</span>
            <span className="text-5xl font-extrabold text-white font-mono tracking-tighter">
              {session?.overall_score || 0}%
            </span>
            <span className="text-[10px] text-white/40 mt-1 font-semibold uppercase tracking-wider">Practice Competency</span>
          </div>
        </motion.div>

        {/* AI Executive Summary Report */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0d0d0d] border border-white/10 shadow-2xl rounded-xs p-6 sm:p-8"
        >
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-4 pb-2 border-b border-white/5 flex items-center gap-2 font-medium">
            <Award className="w-4 h-4 text-white/40" />
            Executive Coach Feedback
          </h3>
          <CustomMarkdown text={session?.overall_feedback || ""} />
        </motion.div>

        {/* Interview Q&A Transcript */}
        <div className="space-y-4">
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/40 flex items-center gap-2 mb-4 pl-1 font-medium">
            <BookOpen className="w-4 h-4 text-white/30" />
            Detailed Question-by-Question Transcript
          </h3>

          {transcript.map((item, idx) => {
            const isExpanded = expandedIndex === idx;
            const hasAnswer = item.answer !== null;
            const score = item.answer?.score_json.overall || 0;

            return (
              <motion.div
                key={item.question.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-[#0d0d0d] rounded-xs border border-white/10 shadow-2xl overflow-hidden"
              >
                {/* Header Collapsible Trigger */}
                <button
                  onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                  className="w-full text-left p-5 flex justify-between items-center hover:bg-white/[0.02] transition-all cursor-pointer"
                >
                  <div className="pr-4 truncate">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-white/40">
                      Question {idx + 1} • {item.question.question_type}
                    </span>
                    <p className="text-sm font-serif italic text-white/80 truncate mt-1">
                      "{item.question.question_text}"
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {hasAnswer ? (
                      <span className="text-xs font-mono font-bold px-2 py-1 bg-white/5 border border-white/10 text-white rounded-xs">
                        {score}/10
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-1 bg-white/5 border border-white/10 text-white/30 rounded-xs">
                        Unanswered
                      </span>
                    )}
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                  </div>
                </button>

                {/* Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-white/5 bg-[#0d0d0d]"
                    >
                      <div className="p-6 space-y-6">
                        {/* Question full text */}
                        <div className="bg-white/[0.01] border border-white/5 p-4 rounded-xs">
                          <p className="text-[9px] font-mono uppercase tracking-widest text-white/40 mb-1">Full Question Prompt</p>
                          <p className="text-xs text-white/80 font-serif italic">"{item.question.question_text}"</p>
                        </div>

                        {hasAnswer ? (
                          <>
                            {/* Candidate Answer */}
                            <div className="space-y-1.5">
                              <p className="text-[9px] font-mono uppercase tracking-widest text-white/40">Your Submitted Answer</p>
                              <p className="text-xs text-white/70 leading-relaxed font-mono bg-white/[0.01] p-4 rounded-xs border border-white/5 whitespace-pre-wrap">
                                "{item.answer?.answer_text}"
                              </p>
                            </div>

                            {/* Score Breakdown */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/[0.02] p-4 rounded-xs border border-white/5">
                              {[
                                { name: "Clarity", val: item.answer?.score_json.clarity },
                                { name: "STAR Structure", val: item.answer?.score_json.structure },
                                { name: "Relevance", val: item.answer?.score_json.relevance },
                                { name: "Technical Accuracy", val: item.answer?.score_json.technical_accuracy },
                              ].map((sc) => (
                                <div key={sc.name} className="text-center">
                                  <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest font-mono">{sc.name}</p>
                                  <p className="text-sm font-bold text-white mt-0.5 font-mono">{sc.val}/10</p>
                                </div>
                              ))}
                            </div>

                            {/* Grader Critique */}
                            <div className="space-y-1.5">
                              <p className="text-[9px] font-mono uppercase tracking-widest text-white/40">Critique & Analysis</p>
                              <div className="text-xs text-white/70 leading-relaxed whitespace-pre-line prose prose-invert prose-sm max-w-none font-sans">
                                {item.answer?.feedback_text}
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-4 text-xs font-mono text-white/30">
                            No answer was logged for this question prompt.
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
