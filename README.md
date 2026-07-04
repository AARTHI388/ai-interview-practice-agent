# AI Interview Practice Agent

> Practice job interviews with an AI interviewer that asks role-specific questions, gives structured feedback, and tracks your progress.

**Live Demo:** https://ai-interview-practice-agent.vercel.app

---

## Overview

Preparing for interviews is hard. Most candidates struggle to simulate real interview pressure, get objective feedback on their answers, and track improvement over time. The **AI Interview Practice Agent** solves this by providing an on-demand AI interviewer that:
- Generates role-specific questions grounded in real interview patterns
- Asks natural follow-ups like a real interviewer
- Scores answers on clarity, structure, relevance, and technical accuracy
- Tracks progress over multiple sessions so you can see improvement

---

## Features

- **Role & JD Intake** — Select a target role or paste a job description and resume
- **RAG-Powered Questions** — Questions are grounded in a curated question bank via ChromaDB
- **Interactive Interview Loop** — One question at a time with natural follow-ups
- **Structured Feedback Engine** — JSON-scored feedback after every answer
- **Progress Dashboard** — Score trends over time
- **Difficulty Adaptation** — Questions get harder or easier based on your performance

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI (Python 3.11+) |
| Frontend | React + Vite + TypeScript + Tailwind CSS |
| LLM | Anthropic Claude API (`claude-sonnet-4-6`) with OpenAI fallback |
| Vector DB | ChromaDB (local, persistent) |
| Relational DB | SQLite via SQLAlchemy ORM |
| Charts | Recharts |
| Deployment | Render (backend) + Vercel (frontend) |
| Version Control | GitHub |

---

## Architecture

```
Frontend (React/Vite) <-> Backend (FastAPI) <-> LLM Provider (Anthropic/OpenAI)
                                      |
                                      +-> SQLite (users, sessions, answers, progress)
                                      |
                                      +-> ChromaDB (question bank + model answers for RAG)
```

- The frontend exposes a chat-style UI for the interview flow and a progress dashboard.
- The FastAPI backend manages sessions, stores structured data in SQLite, and retrieves grounding context from ChromaDB.
- The LLM provider layer abstracts Anthropic Claude and OpenAI, defaulting to Anthropic if available.
- Prompt templates live in `backend/prompts/` and are loaded at runtime, keeping prompt engineering separate from business logic.

---

## Prompt Engineering Approach

We treat prompt engineering as a first-class concern. All prompts are versioned text files in `backend/prompts/` and are loaded at runtime rather than inlined in code.

### 1. Separate Personas, Separate Calls
Instead of one mega-prompt, we use three distinct system prompts for three separate LLM calls:
- **Interviewer** (`system_interviewer.txt`): Defines the persona, tone, and hard constraints (one question at a time, never reveal rubric, max 1-2 follow-ups).
- **Question Generator** (`system_question_generator.txt`): Generates the initial question set grounded in RAG context.
- **Grader** (`system_grader.txt`): Grades answers and enforces strict JSON output matching a Pydantic schema.

### 2. Few-Shot Examples in Grading
The grader prompt includes 3 example Q&A pairs with expected JSON outputs. This anchors scoring consistency across sessions.

### 3. Structured Output Enforcement
Both the question generator and grader request strict JSON matching a defined schema. The backend parses and validates JSON, with retry logic (up to 3 attempts) on parse failure.

### 4. Chain-of-Thought (Hidden)
The grader prompt instructs the model to reason step-by-step internally before producing the final JSON. The raw chain-of-thought is never returned to the user.

### 5. Temperature & Parameter Tuning
- Grading: `temperature=0.2` for consistency
- Question generation: `temperature=0.7` for variety
- Context window: only the last N turns + retrieved RAG chunks are passed to the LLM.

### 6. Guardrails
- Input sanitization on resume/JD text fields to reduce prompt injection risk
- Refusal of off-topic/abusive input via interviewer persona constraints
- API rate limits and timeouts via the provider layer

---

## Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- Git

### Backend

1. Clone the repo:
   ```bash
   git clone https://github.com/aarti098/ai-interview-practice-agent.git
   cd ai-interview-practice-agent/backend
   ```

2. Create a virtual environment and install dependencies:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Copy `.env.example` to `.env` and add your API keys:
   ```env
   ANTHROPIC_API_KEY=your_key_here
   OPENAI_API_KEY=your_fallback_key_here
   ```

4. Seed the database:
   ```bash
   python seed_data.py
   ```

5. Run the backend:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

### Frontend

1. In a new terminal:
   ```bash
   cd ../frontend
   npm install
   ```

2. Create a `.env` file if your backend is not at the default proxy:
   ```env
   VITE_API_URL=http://localhost:8000/api
   ```

3. Run the frontend:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:5173` in your browser.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/session/start` | Create session and generate first question |
| POST | `/api/session/{id}/answer` | Submit answer, get feedback + next question |
| POST | `/api/session/{id}/end` | End session and get summary |
| GET | `/api/session/{id}` | Fetch session transcript |
| GET | `/api/users/{id}/progress` | Historical scores for progress charts |
| GET | `/api/health` | Health check |

OpenAPI docs are available at `/docs` when the backend is running.

---

## Folder Structure

```
ai-interview-practice-agent/
  backend/
    main.py
    database.py
    models.py
    schemas.py
    llm_provider.py
    seed_data.py
    requirements.txt
    .env.example
    prompts/
      __init__.py
      system_interviewer.txt
      system_question_generator.txt
      system_grader.txt
    routers/
      __init__.py
      sessions.py
      health.py
    services/
      __init__.py
      rag_service.py
      interview_service.py
      grading_service.py
      session_service.py
  frontend/
    package.json
    vite.config.ts
    tsconfig.json
    index.html
    tailwind.config.js
    postcss.config.js
    src/
      main.tsx
      App.tsx
      index.css
      vite-env.d.ts
      types/index.ts
      services/api.ts
      pages/Home.tsx
      pages/Interview.tsx
      pages/Progress.tsx
      components/FeedbackCard.tsx
      components/ProgressDashboard.tsx
```

---

## Future Improvements

- OAuth / email-based authentication
- Audio recording and speech-to-text answers
- Real-time WebSocket streaming for chat
- More roles and industries in the question bank
- User profile management and saved interviews
- Multi-language support
- Admin panel for editing the question bank
- More granular analytics (per-question difficulty trends, category breakdowns)

---

## License

MIT — see [LICENSE](LICENSE) for details.
