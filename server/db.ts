import fs from "fs";
import path from "path";

export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  role: string;
  job_description: string;
  started_at: string;
  ended_at: string | null;
  overall_score: number | null;
  overall_feedback?: string;
  current_question_index: number;
  questions: string[]; // List of questions generated for this session
}

export interface QuestionAsked {
  id: string;
  session_id: string;
  question_text: string;
  question_type: string; // 'behavioral' | 'technical'
  difficulty: string; // 'easy' | 'medium' | 'hard'
  asked_at: string;
}

export interface Answer {
  id: string;
  question_id: string;
  session_id: string; // convenient lookup
  answer_text: string;
  score_json: {
    clarity: number; // 1-10
    structure: number; // 1-10 (STAR method)
    relevance: number; // 1-10
    technical_accuracy: number; // 1-10
    overall: number; // 1-10
  };
  feedback_text: string;
  created_at: string;
}

interface DatabaseSchema {
  users: User[];
  sessions: Session[];
  questions_asked: QuestionAsked[];
  answers: Answer[];
}

const DB_FILE = path.join(process.cwd(), "data", "db.json");

// Ensure data directory exists
function ensureDataDir() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Read database
export function readDb(): DatabaseSchema {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    const initialDb: DatabaseSchema = {
      users: [
        {
          id: "default-user",
          name: "Guest Practitioner",
          email: "guest@example.com",
          created_at: new Date().toISOString(),
        },
      ],
      sessions: [],
      questions_asked: [],
      answers: [],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), "utf-8");
    return initialDb;
  }
  try {
    const content = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error("Error reading database, resetting...", error);
    const initialDb: DatabaseSchema = {
      users: [
        {
          id: "default-user",
          name: "Guest Practitioner",
          email: "guest@example.com",
          created_at: new Date().toISOString(),
        },
      ],
      sessions: [],
      questions_asked: [],
      answers: [],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), "utf-8");
    return initialDb;
  }
}

// Write database atomically
export function writeDb(db: DatabaseSchema) {
  ensureDataDir();
  const tempFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), "utf-8");
  fs.renameSync(tempFile, DB_FILE);
}

// DB Operations
export const dbOps = {
  // Users
  getUser(id: string): User | undefined {
    const db = readDb();
    return db.users.find((u) => u.id === id);
  },

  createUser(name: string, email: string): User {
    const db = readDb();
    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      created_at: new Date().toISOString(),
    };
    db.users.push(newUser);
    writeDb(db);
    return newUser;
  },

  updateUser(id: string, name: string, email: string): User {
    const db = readDb();
    const idx = db.users.findIndex((u) => u.id === id);
    if (idx === -1) {
      throw new Error("User not found");
    }
    db.users[idx].name = name;
    db.users[idx].email = email;
    writeDb(db);
    return db.users[idx];
  },

  // Sessions
  startSession(userId: string, role: string, jobDescription: string, questions: string[]): Session {
    const db = readDb();
    const newSession: Session = {
      id: `session-${Date.now()}`,
      user_id: userId,
      role,
      job_description: jobDescription,
      started_at: new Date().toISOString(),
      ended_at: null,
      overall_score: null,
      current_question_index: 0,
      questions,
    };
    db.sessions.push(newSession);
    writeDb(db);
    return newSession;
  },

  getSession(id: string): Session | undefined {
    const db = readDb();
    return db.sessions.find((s) => s.id === id);
  },

  updateSessionQuestionIndex(id: string, index: number): Session {
    const db = readDb();
    const idx = db.sessions.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error("Session not found");
    db.sessions[idx].current_question_index = index;
    writeDb(db);
    return db.sessions[idx];
  },

  endSession(id: string, overallScore: number, overallFeedback: string): Session {
    const db = readDb();
    const idx = db.sessions.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error("Session not found");
    db.sessions[idx].ended_at = new Date().toISOString();
    db.sessions[idx].overall_score = overallScore;
    db.sessions[idx].overall_feedback = overallFeedback;
    writeDb(db);
    return db.sessions[idx];
  },

  getSessionsForUser(userId: string): Session[] {
    const db = readDb();
    return db.sessions.filter((s) => s.user_id === userId);
  },

  // Questions Asked
  addQuestionAsked(sessionId: string, text: string, type: string, difficulty: string): QuestionAsked {
    const db = readDb();
    const newQuestion: QuestionAsked = {
      id: `question-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      session_id: sessionId,
      question_text: text,
      question_type: type,
      difficulty,
      asked_at: new Date().toISOString(),
    };
    db.questions_asked.push(newQuestion);
    writeDb(db);
    return newQuestion;
  },

  getQuestionsForSession(sessionId: string): QuestionAsked[] {
    const db = readDb();
    return db.questions_asked.filter((q) => q.session_id === sessionId);
  },

  // Answers
  addAnswer(questionId: string, sessionId: string, answerText: string, scoreJson: Answer["score_json"], feedbackText: string): Answer {
    const db = readDb();
    const newAnswer: Answer = {
      id: `answer-${Date.now()}`,
      question_id: questionId,
      session_id: sessionId,
      answer_text: answerText,
      score_json: scoreJson,
      feedback_text: feedbackText,
      created_at: new Date().toISOString(),
    };
    db.answers.push(newAnswer);
    writeDb(db);
    return newAnswer;
  },

  getAnswersForSession(sessionId: string): Answer[] {
    const db = readDb();
    return db.answers.filter((a) => a.session_id === sessionId);
  },

  // Transcript helper
  getSessionTranscript(sessionId: string) {
    const questions = this.getQuestionsForSession(sessionId);
    const answers = this.getAnswersForSession(sessionId);

    return questions.map((q) => {
      const a = answers.find((ans) => ans.question_id === q.id);
      return {
        question: q,
        answer: a || null,
      };
    });
  },

  // User historical progress summary
  getUserProgress(userId: string) {
    const sessions = this.getSessionsForUser(userId).filter((s) => s.ended_at !== null);
    const db = readDb();
    
    // Get all answers across these sessions
    const sessionIds = sessions.map((s) => s.id);
    const userAnswers = db.answers.filter((a) => sessionIds.includes(a.session_id));

    // Sort sessions by date
    sessions.sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());

    const sessionProgress = sessions.map((s) => {
      const sAnswers = userAnswers.filter((a) => a.session_id === s.id);
      
      // Calculate averages for this session
      let clarity = 0;
      let structure = 0;
      let relevance = 0;
      let technical_accuracy = 0;
      let overall = 0;

      if (sAnswers.length > 0) {
        sAnswers.forEach((ans) => {
          clarity += ans.score_json.clarity;
          structure += ans.score_json.structure;
          relevance += ans.score_json.relevance;
          technical_accuracy += ans.score_json.technical_accuracy;
          overall += ans.score_json.overall;
        });

        clarity /= sAnswers.length;
        structure /= sAnswers.length;
        relevance /= sAnswers.length;
        technical_accuracy /= sAnswers.length;
        overall /= sAnswers.length;
      }

      return {
        sessionId: s.id,
        role: s.role,
        date: s.started_at,
        score: s.overall_score || overall * 10, // Scale to 100
        categories: {
          clarity: Number(clarity.toFixed(1)),
          structure: Number(structure.toFixed(1)),
          relevance: Number(relevance.toFixed(1)),
          technical_accuracy: Number(technical_accuracy.toFixed(1)),
          overall: Number(overall.toFixed(1)),
        }
      };
    });

    return {
      sessionsCount: sessions.length,
      answersCount: userAnswers.length,
      sessionProgress,
    };
  }
};
