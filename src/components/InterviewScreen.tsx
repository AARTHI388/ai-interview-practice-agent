import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, ArrowRight, Sparkles, Send, CheckCircle2, Award, ChevronDown, ChevronUp, BarChart2, BookOpen, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CurrentQuestion, GradedFeedback } from "../types";

interface InterviewScreenProps {
  role: string;
  difficulty: string;
  currentQuestion: CurrentQuestion;
  onSubmitAnswer: (answerText: string, followUpCount: number) => Promise<{
    feedback: GradedFeedback;
    nextQuestion: CurrentQuestion | null;
    isFollowUp: boolean;
    followUpCount: number;
    isEnded: boolean;
  }>;
  onFinishSession: () => void;
}

export default function InterviewScreen({
  role,
  difficulty,
  currentQuestion,
  onSubmitAnswer,
  onFinishSession,
}: InterviewScreenProps) {
  const [answerText, setAnswerText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<GradedFeedback | null>(null);
  const [nextQuestionData, setNextQuestionData] = useState<CurrentQuestion | null>(null);
  const [isFollowUp, setIsFollowUp] = useState(false);
  const [followUpCount, setFollowUpCount] = useState(0);
  const [isSessionEnded, setIsSessionEnded] = useState(false);

  // Accordion collapses
  const [showRewrite, setShowRewrite] = useState(false);
  const [showCritique, setShowCritique] = useState(true);

  const textRef = useRef<HTMLTextAreaElement>(null);

  // Count words
  const wordCount = answerText.trim() ? answerText.trim().split(/\s+/).length : 0;

  useEffect(() => {
    // Scroll to input or feedback on question load
    if (textRef.current) {
      textRef.current.focus();
    }
    // Reset collapses
    setShowRewrite(false);
    setShowCritique(true);
  }, [currentQuestion]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await onSubmitAnswer(answerText, followUpCount);
      setFeedback(result.feedback);
      setNextQuestionData(result.nextQuestion);
      setIsFollowUp(result.isFollowUp);
      setFollowUpCount(result.followUpCount);
      setIsSessionEnded(result.isEnded);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextTurn = () => {
    // Clear state for next turn
    setFeedback(null);
    setAnswerText("");
    if (nextQuestionData) {
      // Parent App component is updated synchronously
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
      {/* Session Progress Header */}
      <div className="bg-[#0d0d0d] rounded-xs border border-white/10 shadow-2xl p-4 sm:p-6 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[9px] uppercase font-bold tracking-widest bg-white/5 border border-white/10 text-white/80 px-2.5 py-1 rounded-xs">
            {difficulty} difficulty
          </span>
          <h2 className="text-base font-serif italic text-white mt-2 truncate max-w-sm sm:max-w-md">
            Practicing: {role}
          </h2>
        </div>
        
        {/* visual progress indicator */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-full sm:w-32 bg-white/5 h-2 rounded-xs overflow-hidden">
            <div
              className="bg-white h-full transition-all duration-500"
              style={{
                width: `${((currentQuestion.index + 1) / currentQuestion.total) * 100}%`,
              }}
            ></div>
          </div>
          <span className="text-xs font-mono text-white/50 whitespace-nowrap">
            Q {currentQuestion.index + 1} of {currentQuestion.total}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Main Conversation & Text Entry area */}
        <div className={`${feedback ? "lg:col-span-3" : "lg:col-span-5"} space-y-6 transition-all duration-300`}>
          {/* Question card */}
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0d0d0d] rounded-xs border border-white/10 shadow-2xl p-6 relative overflow-hidden"
          >
            <div className="absolute right-0 top-0 w-32 h-32 bg-white/[0.01] rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="flex items-center gap-2 text-white/80 mb-3">
              <MessageSquare className="w-4 h-4 text-white/60" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/60">
                {isFollowUp ? "Interviewer Follow-up" : "Interviewer Question"}
              </span>
            </div>

            <p className="text-base sm:text-lg font-serif italic text-white leading-relaxed">
              "{currentQuestion.text}"
            </p>
          </motion.div>

          {/* Answer workspace or submission */}
          {!feedback ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-[#0d0d0d] rounded-xs border border-white/10 shadow-2xl p-6"
            >
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 flex items-center gap-1.5 font-medium">
                    <BookOpen className="w-3.5 h-3.5 text-white/30" />
                    Your Structured Answer
                  </label>
                  <span className={`text-[11px] font-mono ${wordCount < 30 ? "text-amber-400 font-medium" : "text-white/40"}`}>
                    {wordCount} words {wordCount < 30 && "(aim for 50+ words)"}
                  </span>
                </div>

                <textarea
                  ref={textRef}
                  required
                  rows={8}
                  placeholder="Structure your answer clearly. If it's behavioral, try to outline:
• Situation: The background problem you faced.
• Task: What you specifically needed to resolve.
• Action: The exact steps you took (mention libraries, architectures).
• Result: The positive business outcomes achieved (quantified, if possible!)."
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  className="w-full bg-[#111111] border border-white/10 rounded-xs px-4 py-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors font-sans leading-relaxed resize-y"
                />

                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-2">
                  <div className="text-[10px] text-white/30 font-mono flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-white/20" />
                    Format in STAR style. Press Submit to grade metrics.
                  </div>

                  <button
                    type="submit"
                    disabled={!answerText.trim() || isSubmitting}
                    className="py-2.5 px-6 bg-white hover:bg-white/90 disabled:opacity-50 text-black font-serif italic text-sm font-bold tracking-wide rounded-xs shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        Critiquing response...
                      </>
                    ) : (
                      <>
                        Submit Answer
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            /* Submission completed, waiting to progress */
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/5 border border-white/10 rounded-xs p-8 text-center space-y-4"
            >
              <div className="mx-auto w-12 h-12 rounded-xs bg-white/10 flex items-center justify-center text-white">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif italic text-white text-base">Answer Evaluated!</h3>
                <p className="text-xs text-white/50 max-w-sm mx-auto mt-1 leading-relaxed">
                  The AI interviewer evaluated your metrics. Review the right panel report card.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
                {isSessionEnded ? (
                  <button
                    onClick={onFinishSession}
                    className="px-6 py-3 bg-white hover:bg-white/90 text-black font-serif italic text-sm font-bold tracking-wide rounded-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Finish and View Report Card
                    <Award className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleNextTurn}
                    className="px-6 py-3 bg-white hover:bg-white/90 text-black font-serif italic text-sm font-bold tracking-wide rounded-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isFollowUp ? "Next Follow-up Question" : "Proceed to Next Question"}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* FEEDBACK SCORECARD PANEL (Slides/Fades in) */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="lg:col-span-2 space-y-6"
            >
              {/* Overall scorecard */}
              <div className="bg-[#0d0d0d] rounded-xs border border-white/10 shadow-2xl p-6 space-y-5">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/40 flex items-center gap-1.5 font-medium">
                    <Award className="w-4 h-4 text-white/30" />
                    Response Scorecard
                  </h3>
                  <div className="flex items-baseline gap-0.5 bg-white/5 text-white font-mono font-extrabold px-2.5 py-1 rounded-xs text-sm border border-white/10">
                    <span>{feedback.overall}</span>
                    <span className="text-[10px] text-white/40">/10</span>
                  </div>
                </div>

                {/* Score list breakdown */}
                <div className="space-y-4">
                  {[
                    { label: "Clarity & Delivery", val: feedback.clarity },
                    { label: "STAR Structure", val: feedback.structure },
                    { label: "Relevance", val: feedback.relevance },
                    { label: "Technical Expertise", val: feedback.technical_accuracy },
                  ].map((score) => (
                    <div key={score.label} className="space-y-1">
                      <div className="flex justify-between text-xs font-mono text-white/60">
                        <span>{score.label}</span>
                        <span>{score.val}/10</span>
                      </div>
                      <div className="w-full bg-white/5 h-1.5 rounded-xs overflow-hidden">
                        <div
                          className="h-full rounded-xs transition-all duration-1000 bg-white"
                          style={{ width: `${score.val * 10}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Collapsible Actionable Critique */}
              <div className="bg-[#0d0d0d] rounded-xs border border-white/10 shadow-2xl overflow-hidden">
                <button
                  onClick={() => setShowCritique(!showCritique)}
                  className="w-full px-6 py-4 flex justify-between items-center hover:bg-white/[0.02] transition-all font-serif italic text-white text-sm border-b border-white/5 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-white/40" />
                    Actionable Critique Analysis
                  </span>
                  {showCritique ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                </button>

                <AnimatePresence>
                  {showCritique && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-6 text-xs text-white/70 leading-relaxed space-y-3 bg-[#0d0d0d]"
                    >
                      <div className="whitespace-pre-line font-sans prose prose-invert prose-sm text-white/70">
                        {feedback.feedback_text}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Collapsible Premium rewrite */}
              <div className="bg-[#0d0d0d] rounded-xs border border-white/10 shadow-2xl overflow-hidden">
                <button
                  onClick={() => setShowRewrite(!showRewrite)}
                  className="w-full px-6 py-4 flex justify-between items-center hover:bg-white/[0.02] transition-all font-serif italic text-white text-sm border-b border-white/5 cursor-pointer"
                >
                  <span className="flex items-center gap-2 text-white">
                    <Sparkles className="w-4 h-4 text-white/40" />
                    Stellar STAR Method Model Answer
                  </span>
                  {showRewrite ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                </button>

                <AnimatePresence>
                  {showRewrite && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-6 bg-white/[0.02] text-xs text-white/80 italic border-t border-white/5 leading-relaxed whitespace-pre-line font-mono"
                    >
                      "{feedback.suggested_star_rewrite}"
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
