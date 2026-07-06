import { GoogleGenAI, Type } from "@google/genai";
import { QUESTION_BANK, QuestionBankItem } from "./rag";

export interface GradedFeedback {
  reasoning: string; // internal hidden chain of thought
  clarity: number; // 1-10
  structure: number; // 1-10 (STAR method application)
  relevance: number; // 1-10
  technical_accuracy: number; // 1-10
  overall: number; // 1-10
  feedback_text: string; // friendly, detailed constructive critique
  suggested_star_rewrite: string; // rewrite of a key part of their answer in stellar STAR format
}

export interface NextTurnResult {
  next_question: string;
  is_follow_up: boolean;
  follow_up_count: number;
}

export class LLMService {
  private ai: GoogleGenAI;
  private modelName = "gemini-3.5-flash";

  constructor(apiKey?: string) {
    this.ai = new GoogleGenAI({
      apiKey: apiKey || process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }

  /**
   * Generates tailored questions using the grounded RAG questions + target JD/Role.
   * This is the "question-generator" role.
   */
  async generateTailoredQuestions(
    role: string,
    jobDescription: string,
    resumeText: string,
    ragQuestions: QuestionBankItem[],
    count: number = 5
  ): Promise<string[]> {
    const groundedContext = ragQuestions
      .map((q, idx) => `[Example ${idx + 1}] Role: ${q.role} | Type: ${q.question_type} | Difficulty: ${q.difficulty}\nQuestion: ${q.question_text}\nModel Answer: ${q.model_answer}`)
      .join("\n\n");

    const systemPrompt = `You are an expert technical recruiter and senior hiring manager specializing in formulating highly relevant, targeted job interview questions.
Your role is to generate exactly ${count} highly targeted, challenging interview questions based on a Target Role, a Job Description, and optionally the Candidate's Resume.
You must ground your question styles in the provided high-quality question bank. Ensure a mix of technical competency questions and behavioral STAR-method questions.

Hard rules:
1. Return exactly ${count} questions.
2. Tailor them closely to the candidate's target role and any specific tech stack or skill mentioned in the job description or resume.
3. Keep questions professional, direct, and conversational (do not add numbering or prefix titles like 'Question 1:' in the string values).
4. Do not mention the candidate's resume directly in the questions. Maintain a professional, realistic interviewer tone.`;

    const contents = `
Target Role: ${role}

Job Description:
${jobDescription || "Not provided."}

Candidate Resume:
${resumeText || "Not provided."}

Grounded Question Bank & Model Answers (RAG context):
${groundedContext}

Please generate exactly ${count} interview questions. Return them as a JSON list.
`;

    try {
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7, // variety
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING,
                },
                description: `A list of exactly ${count} generated interview questions.`,
              },
            },
            required: ["questions"],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      if (parsed.questions && parsed.questions.length > 0) {
        return parsed.questions;
      }
    } catch (e) {
      console.error("Error generating tailored questions via Gemini, falling back to RAG bank questions.", e);
    }

    // Fallback: return the questions from the RAG bank directly
    return ragQuestions.map((q) => q.question_text);
  }

  /**
   * Grades a candidate's answer. This is the "grader" role.
   * Leverages few-shot examples and hidden chain-of-thought inside the schema.
   */
  async gradeAnswer(
    questionText: string,
    userAnswer: string,
    role: string,
    modelAnswer?: string
  ): Promise<GradedFeedback> {
    const systemInstruction = `You are a strict, senior technical interviewer and performance grader. 
Your goal is to evaluate the candidate's answer with precise scoring and actionable, direct feedback.

Critique criteria:
1. Clarity (cohesiveness, speaking confidence, flow, vocabulary).
2. Structure (application of the STAR method: Situation, Task, Action, Result). Is there a clear outcome?
3. Relevance (directly answering the prompt, avoiding rambling).
4. Technical Accuracy/Expertise (correct terminology, architectural logic, and depth).

STAR Method Assessment Rules:
- Situation & Task: Did they explain the context clearly and what was expected?
- Action: What did THEY specifically do? (Avoid abstract 'we' statements).
- Result: Did they deliver a quantitative or qualitative outcome? (e.g., speed increased, bugs solved).

Few-shot training cases (Anchor Scores):
[Example 1]
Question: "Tell me about a time you had a database bottleneck."
Answer: "We had a slow db so we added indexes and it made things faster."
Grade: Clarity: 5, Structure: 3 (No STAR details), Relevance: 8, Technical Accuracy: 5 (No specifics), Overall: 5.
Critique: Candidate lacked specifics on the exact query, index type, and did not state the quantitative speed improvement.

[Example 2]
Question: "Tell me about a database bottleneck."
Answer: "At my last job, our dashboard queries took 8 seconds. My task was to optimize it. I analyzed SQL query plans, discovered a missing composite index on (user_id, created_at), and implemented Redis caching. This reduced page load to 150ms."
Grade: Clarity: 9, Structure: 10 (Perfect STAR), Relevance: 10, Technical Accuracy: 9, Overall: 9.5.
Critique: Superb. Covered Situation (8s delay), Task (optimize), Action (plans, composite index, Redis), and Result (150ms).

Guidelines:
- Analyze step-by-step internally under the "reasoning" key before setting the numeric scores.
- Be highly constructive but honest. Do not inflate scores. Average answers should score around 5-7; only truly stellar, structured, and deep responses should score 9-10.
- Formulate a 'suggested_star_rewrite' in first person as a template of what an elite candidate would say.`;

    const contents = `
Target Role: ${role}
Question: ${questionText}
Model Answer Reference (Optional Grounding): ${modelAnswer || "N/A"}
Candidate Answer: ${userAnswer}

Please grade this answer carefully and return the structured JSON evaluation.
`;

    try {
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents,
        config: {
          systemInstruction,
          temperature: 0.2, // consistent, deterministic grading
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reasoning: {
                type: Type.STRING,
                description: "Detailed, step-by-step internal analysis of the answer against STAR method and correctness.",
              },
              clarity: {
                type: Type.INTEGER,
                description: "Score from 1 to 10 evaluating communication, confidence, and flow.",
              },
              structure: {
                type: Type.INTEGER,
                description: "Score from 1 to 10 evaluating structure and STAR method utilization.",
              },
              relevance: {
                type: Type.INTEGER,
                description: "Score from 1 to 10 evaluating if they stayed on topic and answered the exact question.",
              },
              technical_accuracy: {
                type: Type.INTEGER,
                description: "Score from 1 to 10 evaluating technical details, depth, and vocabulary accuracy.",
              },
              overall: {
                type: Type.INTEGER,
                description: "The holistic score from 1 to 10 reflecting the general quality of the response.",
              },
              feedback_text: {
                type: Type.STRING,
                description: "Actively helpful, encouraging but direct critique showing exactly how to improve this answer.",
              },
              suggested_star_rewrite: {
                type: Type.STRING,
                description: "A professional, exemplary first-person rewrite showing how this answer looks in premium STAR format.",
              },
            },
            required: [
              "reasoning",
              "clarity",
              "structure",
              "relevance",
              "technical_accuracy",
              "overall",
              "feedback_text",
              "suggested_star_rewrite",
            ],
          },
        },
      });

      const parsed: GradedFeedback = JSON.parse(response.text || "{}");
      return parsed;
    } catch (e) {
      console.error("Error grading answer via Gemini:", e);
      // Fallback evaluation
      return {
        reasoning: "Grader failed to run, applied standard fallback.",
        clarity: 6,
        structure: 5,
        relevance: 7,
        technical_accuracy: 5,
        overall: 6,
        feedback_text: "We were able to capture your answer, but the grading AI encountered a temporary connection issue. Good effort! Focus on outlining the Situation, Task, Action, and Result (STAR method) next time.",
        suggested_star_rewrite: "I encountered a challenge (Situation), my goal was to solve it (Task), I implemented a solid strategy (Action), and improved outcomes by 30% (Result).",
      };
    }
  }

  /**
   * Decides whether to ask a follow-up or move to the next main question.
   * This is the "interviewer" role. Max 1-2 follow-ups per main question.
   */
  async decideFollowUpOrNext(
    questionText: string,
    userAnswer: string,
    feedbackText: string,
    overallScore: number,
    followUpCount: number
  ): Promise<NextTurnResult> {
    // If we've already done 1 or 2 follow-ups, or if the answer is highly complete (score >= 8), move forward
    if (followUpCount >= 1 || overallScore >= 8) {
      return {
        next_question: "",
        is_follow_up: false,
        follow_up_count: 0,
      };
    }

    const systemInstruction = `You are a conversational, interactive AI Job Interviewer.
Your role is to decide if you should probe further with a direct, single follow-up question, or if you should wrap up and let the system proceed to the next question.
Keep follow-ups challenging, natural, and directly related to gaps in their previous answer (e.g., if they forgot to explain the Result, or if a technical term was mentioned but not elaborated).

If you decide to ask a follow-up, provide the question string.
If the candidate's answer is already thorough, complete, or if a follow-up is not warranted, return empty next_question.`;

    const contents = `
Current Question: ${questionText}
Candidate Answer: ${userAnswer}
Grader Evaluation: ${feedbackText}
Grader Score: ${overallScore}/10
Follow-ups asked so far: ${followUpCount}

Determine if we should ask a follow-up. Return a structured JSON response.
`;

    try {
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents,
        config: {
          systemInstruction,
          temperature: 0.6,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              should_follow_up: { type: Type.BOOLEAN },
              follow_up_question: { type: Type.STRING, description: "A natural, conversational follow-up question. Return empty if should_follow_up is false." },
            },
            required: ["should_follow_up", "follow_up_question"],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      if (parsed.should_follow_up && parsed.follow_up_question) {
        return {
          next_question: parsed.follow_up_question,
          is_follow_up: true,
          follow_up_count: followUpCount + 1,
        };
      }
    } catch (e) {
      console.error("Error deciding follow-up", e);
    }

    return {
      next_question: "",
      is_follow_up: false,
      follow_up_count: 0,
    };
  }

  /**
   * Generates a final overall report card for the session.
   */
  async generateOverallReport(
    role: string,
    transcript: Array<{ question: string; answer: string; score: number; feedback: string }>
  ): Promise<{ overall_feedback: string; overall_score: number }> {
    const systemInstruction = `You are a world-class professional interview coach.
Your job is to read an interview session transcript and synthesize an executive-level performance summary report.
Highlight exactly:
1. Core Strengths (What went exceptionally well, technical competencies shown).
2. Key Improvement Areas (Where they fell short, lack of STAR format, hand-waving).
3. Personal Action Plan (Concrete exercises or tips for their next practice).

Your output feedback must be visually stunning and well-structured, utilizing clean markdown.`;

    const transcriptStr = transcript
      .map((t, idx) => `Question ${idx + 1}: ${t.question}\nAnswer: ${t.answer}\nScore: ${t.score}/10\nFeedback: ${t.feedback}`)
      .join("\n\n---\n\n");

    const contents = `
Target Role: ${role}
Session Transcript:
${transcriptStr}

Please generate the final markdown summary and compute the final overall average score (out of 100).
`;

    try {
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents,
        config: {
          systemInstruction,
          temperature: 0.3,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overall_feedback_markdown: {
                type: Type.STRING,
                description: "Visual, constructive overall session summary using markdown headings, lists, and bullet points.",
              },
              calculated_score: {
                type: Type.INTEGER,
                description: "A composite final grade score out of 100 based on the average performance.",
              },
            },
            required: ["overall_feedback_markdown", "calculated_score"],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      return {
        overall_feedback: parsed.overall_feedback_markdown || "Good effort! Practice more to refine your STAR method answers.",
        overall_score: parsed.calculated_score || 70,
      };
    } catch (e) {
      console.error("Error generating overall report:", e);
      const avgScore = Math.round(
        (transcript.reduce((acc, t) => acc + t.score, 0) / Math.max(1, transcript.length)) * 10
      );
      return {
        overall_feedback: `### Practice Session Summary\nGreat practice session for the **${role}** role! You completed all questions. Refine your answers using the STAR method for higher scores next time.`,
        overall_score: avgScore,
      };
    }
  }
}
