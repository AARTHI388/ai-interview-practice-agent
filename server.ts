import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

import { dbOps } from "./server/db";
import { RAGEngine } from "./server/rag";
import { LLMService } from "./server/llm";

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Initialize services
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
  console.warn("WARNING: GEMINI_API_KEY is not set or using default placeholder. AI features will run in fallback mode.");
}

const ragEngine = new RAGEngine(apiKey);
const llmService = new LLMService(apiKey);

// --- API ROUTES ---

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Start a new session
app.post("/api/session/start", async (req, res) => {
  try {
    const { role, jobDescription = "", resumeText = "", difficulty = "medium" } = req.body;

    if (!role) {
      res.status(400).json({ error: "Role is required" });
      return;
    }

    // 1. Retrieve grounding questions from RAG question bank
    const count = 5;
    const ragQuestions = await ragEngine.retrieveQuestions(role, jobDescription, count, difficulty);

    // 2. Generate tailored questions from LLM using RAG context
    const questions = await llmService.generateTailoredQuestions(
      role,
      jobDescription,
      resumeText,
      ragQuestions,
      count
    );

    // 3. Start session in DB
    const session = dbOps.startSession("default-user", role, jobDescription, questions);

    // 4. Record the first question as "asked" in the DB
    const firstQuestionText = questions[0];
    const firstQuestionRec = dbOps.addQuestionAsked(
      session.id,
      firstQuestionText,
      "behavioral", // default categorization
      difficulty
    );

    res.json({
      session,
      currentQuestion: {
        id: firstQuestionRec.id,
        text: firstQuestionText,
        index: 0,
        total: questions.length,
      },
    });
  } catch (error: any) {
    console.error("Error in /api/session/start:", error);
    res.status(500).json({ error: error?.message || "Failed to start practice session" });
  }
});

// Submit an answer & get immediate feedback + next step
app.post("/api/session/:id/answer", async (req, res) => {
  try {
    const { id: sessionId } = req.params;
    const { answerText, questionId, followUpCount = 0 } = req.body;

    if (!answerText) {
      res.status(400).json({ error: "Answer text is required" });
      return;
    }

    const session = dbOps.getSession(sessionId);
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    // Find the question asked
    const questionsAsked = dbOps.getQuestionsForSession(sessionId);
    const currentQuestionRec = questionsAsked.find((q) => q.id === questionId);
    
    if (!currentQuestionRec) {
      res.status(400).json({ error: "Matching question record not found" });
      return;
    }

    // 1. Grade the answer
    const feedback = await llmService.gradeAnswer(
      currentQuestionRec.question_text,
      answerText,
      session.role
    );

    // 2. Store answer and score in DB
    dbOps.addAnswer(
      currentQuestionRec.id,
      sessionId,
      answerText,
      {
        clarity: feedback.clarity,
        structure: feedback.structure,
        relevance: feedback.relevance,
        technical_accuracy: feedback.technical_accuracy,
        overall: feedback.overall,
      },
      feedback.feedback_text
    );

    // 3. Decide if we should ask a follow-up or move to next question
    const decision = await llmService.decideFollowUpOrNext(
      currentQuestionRec.question_text,
      answerText,
      feedback.feedback_text,
      feedback.overall,
      followUpCount
    );

    let nextQuestion = null;
    let isFollowUp = false;
    let newFollowUpCount = 0;
    let isEnded = false;

    if (decision.is_follow_up && decision.next_question) {
      // Ask follow-up question
      nextQuestion = decision.next_question;
      isFollowUp = true;
      newFollowUpCount = decision.follow_up_count;

      // Add follow-up question to the asked history
      const followUpRec = dbOps.addQuestionAsked(
        sessionId,
        nextQuestion,
        "technical",
        currentQuestionRec.difficulty
      );

      res.json({
        feedback,
        nextQuestion: {
          id: followUpRec.id,
          text: nextQuestion,
          index: session.current_question_index,
          total: session.questions.length,
        },
        isFollowUp,
        followUpCount: newFollowUpCount,
        isEnded,
      });
    } else {
      // Move to next main question
      const nextIndex = session.current_question_index + 1;
      
      if (nextIndex < session.questions.length) {
        // Prepare next main question
        const nextQuestionText = session.questions[nextIndex];
        dbOps.updateSessionQuestionIndex(sessionId, nextIndex);

        const nextRec = dbOps.addQuestionAsked(
          sessionId,
          nextQuestionText,
          "behavioral",
          currentQuestionRec.difficulty
        );

        res.json({
          feedback,
          nextQuestion: {
            id: nextRec.id,
            text: nextQuestionText,
            index: nextIndex,
            total: session.questions.length,
          },
          isFollowUp: false,
          followUpCount: 0,
          isEnded: false,
        });
      } else {
        // Session complete!
        isEnded = true;
        res.json({
          feedback,
          nextQuestion: null,
          isFollowUp: false,
          followUpCount: 0,
          isEnded: true,
        });
      }
    }
  } catch (error: any) {
    console.error("Error in /api/session/answer:", error);
    res.status(500).json({ error: error?.message || "Failed to record and grade answer" });
  }
});

// End session & generate final performance report
app.post("/api/session/:id/end", async (req, res) => {
  try {
    const { id: sessionId } = req.params;

    const session = dbOps.getSession(sessionId);
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    // Gather transcript details
    const transcript = dbOps.getSessionTranscript(sessionId);

    const formattedTranscript = transcript
      .filter((item) => item.answer !== null)
      .map((item) => ({
        question: item.question.question_text,
        answer: item.answer!.answer_text,
        score: item.answer!.score_json.overall,
        feedback: item.answer!.feedback_text,
      }));

    if (formattedTranscript.length === 0) {
      // If no answers yet, end session with standard defaults
      const completedSession = dbOps.endSession(
        sessionId,
        0,
        "No questions were answered during this session."
      );
      res.json({ session: completedSession });
      return;
    }

    // 1. Generate overall report card from LLM
    const report = await llmService.generateOverallReport(session.role, formattedTranscript);

    // 2. Persist to session record
    const completedSession = dbOps.endSession(
      sessionId,
      report.overall_score,
      report.overall_feedback
    );

    res.json({
      session: completedSession,
      report,
    });
  } catch (error: any) {
    console.error("Error in /api/session/end:", error);
    res.status(500).json({ error: error?.message || "Failed to generate session summary" });
  }
});

// Get session transcript
app.get("/api/session/:id", (req, res) => {
  try {
    const { id: sessionId } = req.params;
    const session = dbOps.getSession(sessionId);
    
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const transcript = dbOps.getSessionTranscript(sessionId);
    res.json({
      session,
      transcript,
    });
  } catch (error: any) {
    console.error("Error fetching session details:", error);
    res.status(500).json({ error: error?.message || "Failed to retrieve session data" });
  }
});

// Fetch user progress history for graphs
app.get("/api/users/:id/progress", (req, res) => {
  try {
    const { id: userId } = req.params;
    const progress = dbOps.getUserProgress(userId);
    res.json(progress);
  } catch (error: any) {
    console.error("Error fetching progress details:", error);
    res.status(500).json({ error: error?.message || "Failed to retrieve progress records" });
  }
});


// --- INTEGRATE VITE MIDDLEWARE OR SERVE STATIC ASSETS ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode: Use Vite's Dev Server as Middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware mounted successfully.");
  } else {
    // Production Mode: Serve Compiled Static Assets from /dist
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server", err);
});
