# AI Interview Practice Agent

> Master your job interviews with a real-time, RAG-grounded AI coach that scores your structured answers and teaches you the STAR method.

### 🔗 [Live Demo Link](https://ais-dev-vg7oq4dzjbf5azvuckgiyr-420288929487.asia-southeast1.run.app)

---

## 📖 Overview & Problem Statement

Job interviewing is a high-stakes, stressful skill. Most candidates struggle with:
1. **Structuring responses**: Rambling or forgetting to highlight the concrete results of their actions.
2. **Generic practice tools**: Standard practice lists of static questions that fail to simulate realistic, adaptive, and role-specific conversations.
3. **Lack of immediate, objective feedback**: Not knowing what is missing from their answers or how to phrase them to impress hiring managers.

The **AI Interview Practice Agent** solves this by providing an end-to-end full-stack practice suite. By combining **Retrieval-Augmented Generation (RAG)** with advanced LLMs, it retrieves relevant real-world interview questions, dynamically adapts to candidate resumes and job descriptions, asks natural follow-up questions, and evaluates responses utilizing a strict rubric modeled after the **STAR method** (Situation, Task, Action, Result).

---

## 🌟 Key Features

- **Role & JD Intake**: Select presets (Software Engineer, Product Manager, Data Analyst, Sales) or enter custom roles. Paste job descriptions and CVs to ground the AI in your specific background.
- **Semantic RAG Grounding**: Leverages an in-memory vector database using Gemini embeddings to match your target criteria against a curated bank of 50+ professional questions.
- **Interactive Interview Loop**: Simulated real-world conversation with natural, conversational follow-ups (max 1–2 per question) to challenge gaps in your response.
- **STAR Method Scorecard**: Get graded instantly on four distinct categories (Clarity, Relevance, Technical Depth, and STAR Structure) with visual percentage meters.
- **Model Answer Re-writing**: Every critique comes with a customized, first-person exemplary rewrite showing how an elite candidate would answer that exact question.
- **Historical Progress Charts**: A robust analytics dashboard tracking performance trends, overall scores, and category competency breakdowns over multiple attempts.

---

## 🛠️ Tech Stack

| Component | Technology | Detail |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite 6 | SPA client, modular layout |
| **Styling** | Tailwind CSS v4, Motion | High-contrast, polished modern layout, micro-interactions |
| **Backend** | Express, Node.js, `tsx` | Robust full-stack API server, serving compiled assets |
| **AI SDK & Model** | `@google/genai`, `gemini-3.5-flash` | Ultra-fast JSON schema generation, reasoning, and text grading |
| **Embedding Engine** | `gemini-embedding-2-preview` | Cosine similarity semantic search over the question bank |
| **Durable DB Store** | Local File JSON Database (`data/db.json`) | Atomically saved tables: `users`, `sessions`, `questions_asked`, `answers` |
| **Charting** | Recharts | Responsive line and bar analytics graphs |

---

## 📐 Architecture & Connection Flow

```
┌────────────────────────────────────────────────────────┐
│                      Web Browser                       │
│  (React 19, Recharts, Tailwind CSS v4, Motion)         │
└───────────┬────────────────────────────────┬───────────┘
            │                                │
     API requests (Fetch)             Static Assets
            │                                │
┌───────────▼────────────────────────────────▼───────────┐
│              Express Full-Stack Server                 │
│  (Node.js, TypeScript, tsx, esbuild compilation)       │
└───────────┬────────────────────────────────┬───────────┘
            │                                │
      Local DB Operations             Model Generations
            │                                │
┌───────────▼───────────┐          ┌─────────▼───────────┐
│     JSON Database     │          │    Gemini AI API    │
│  (data/db.json tables)│          │  (@google/genai)    │
└───────────────────────┘          └─────────────────────┘
```

1. **Intake & Initiation**: The user sets up their profile and starts an interview. The backend receives the configuration, queries the RAG engine for matching question embeddings, and invokes Gemini to formulate 5 tailored interview prompts.
2. **Active Chat & Submission**: The user submits an answer. The server invokes the AI Grader with few-shot scoring prompts, inserts the score details into `data/db.json`, and computes whether to present a follow-up or move forward.
3. **Analytics**: The progress screen retrieves historical session averages from `data/db.json` and renders interactive charts using Recharts.

---

## 🧠 Prompt Engineering Approach

We implement strict prompt decoupling across three separate, single-responsibility LLM actors in `/server/llm.ts`:

1. **Question Generator (`question-generator`):**
   - **Persona:** Expert Technical Recruiter.
   - **System Prompt:** Instructs the model to blend RAG grounding questions with candidate CV/JD details.
   - **Structured Schema:** Enforces a rigid JSON list of exactly 5 strings to avoid conversational boilerplate.

2. **Grader & Performance Coach (`grader`):**
   - **Persona:** Senior Technical Interviewer.
   - **Anchor Few-Shots:** Includes negative and positive examples demonstrating how to evaluate structural holes (e.g., scoring a thorough answer high, and penalizing answers lacking quantified Results).
   - **Hidden Chain of Thought (CoT):** The model is instructed to output an internal `reasoning` trace analyzing the response before outputting numeric scores.
   - **Deterministic Temperature:** Locked at low temperature (`0.2`) to ensure grading and scoring are consistently calibrated.

3. **Follow-up Evaluator (`interviewer`):**
   - **Persona:** Conversational Job Interviewer.
   - **State Boundary:** Instructed to keep follow-ups direct and restricted to 1–2 prompts max.

---

## 🚀 Local Setup Instructions

### Prerequisites
- Node.js (v18+)
- npm

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/yourusername/ai-interview-practice-agent.git
cd ai-interview-practice-agent
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the project root:
```env
GEMINI_API_KEY="YOUR_ACTUAL_GEMINI_API_KEY"
PORT=3000
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 📌 API Endpoint Reference

### `POST /api/session/start`
Creates a session and generates the tailored question set.
- **Request Body:**
  ```json
  {
    "role": "Software Engineer",
    "jobDescription": "Full stack experience...",
    "resumeText": "5 years React...",
    "difficulty": "medium"
  }
  ```
- **Response:** `{ session, currentQuestion }`

### `POST /api/session/:id/answer`
Submits an answer, gets grades, and retrieves the next follow-up or main question.
- **Request Body:**
  ```json
  {
    "answerText": "I resolved the lock by introducing a Redis distributed queue...",
    "questionId": "question-12345",
    "followUpCount": 0
  }
  ```
- **Response:** `{ feedback, nextQuestion, isFollowUp, isEnded }`

### `POST /api/session/:id/end`
Closes the session and generates the overall performance summary report card.
- **Response:** `{ session, report }`

### `GET /api/session/:id`
Retrieves full transcript and feedback.

### `GET /api/users/:id/progress`
Returns historical averages for rendering charts.

---

## 📁 Folder Structure

```
├── data/
│   └── db.json                # Durable JSON database tables
├── server/
│   ├── db.ts                  # DB tables CRUD operations
│   ├── llm.ts                 # AI prompts & evaluation services
│   └── rag.ts                 # Cosine vector similarity & question bank
├── src/
│   ├── components/
│   │   ├── LandingPage.tsx    # Configuration & setup panel
│   │   ├── InterviewScreen.tsx# Active conversational loop
│   │   ├── ProgressDashboard.tsx # Analytics graphs with Recharts
│   │   └── SessionReportCard.tsx # Visual transcripts & final summaries
│   ├── App.tsx                # Master state controller
│   ├── types.ts               # Shared TypeScript schemas
│   ├── index.css              # Global styles (Tailwind CSS v4)
│   └── main.tsx               # Frontend entry point
├── server.ts                  # Main Express API entry point
├── vite.config.ts             # Vite server configurations
└── package.json               # Scripts & dependencies
```

---

## 🔮 Future Improvements
1. **Real-time Voice Practicing:** Integrating WebSockets with the Gemini Live API for low-latency verbal conversations.
2. **Resume parsing:** PDF parsing on upload to extract resume text automatically.
3. **Multiplayer Mock Battle:** Joint sessions allowing peers to spectate and vote on feedback rubrics.

---

## 📄 License
This project is licensed under the Apache-2.0 License.
