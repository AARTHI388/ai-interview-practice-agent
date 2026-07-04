import logging
import json
import os
from typing import List, Optional
from models import QuestionAsked
from schemas import QuestionResponse
from llm_provider import get_llm_provider
from services.rag_service import retrieve_relevant_questions
from prompts import load_prompt

logger = logging.getLogger(__name__)

QUESTION_GENERATOR_PROMPT = load_prompt("system_question_generator")
INTERVIEWER_PROMPT = load_prompt("system_interviewer")

async def generate_first_questions(session, role: str, job_description: Optional[str], resume_text: Optional[str], n: int = 5) -> List[QuestionResponse]:
    llm = get_llm_provider()
    rag_context = ""
    if job_description:
        rag_docs = retrieve_relevant_questions(job_description, role, n_results=5)
        rag_context = "\n".join([d["text"] for d in rag_docs])
    prompt = QUESTION_GENERATOR_PROMPT.format(
        rag_context=rag_context,
        role=role,
        job_description=job_description or "None",
        resume_text=resume_text or "None",
        previous_avg_score="None",
    )
    response_text = await llm.generate_text(
        system_prompt=INTERVIEWER_PROMPT,
        user_message=prompt,
        max_tokens=1024,
        temperature=0.7,
        response_format="json",
    )
    parsed = json.loads(response_text)
    questions_data = parsed.get("questions", [])
    questions = []
    for idx, q in enumerate(questions_data[:n]):
        questions.append(QuestionResponse(
            id=0,
            session_id=session.id,
            question_text=q["text"],
            question_type=q.get("type", "behavioral"),
            difficulty=q.get("difficulty", "medium"),
            order_index=idx + 1,
            created_at=str(session.started_at),
        ))
    return questions

async def generate_follow_up_or_next(previous_question_text: str, user_answer: str, role: str, session, previous_score: Optional[float]) -> Optional[QuestionResponse]:
    llm = get_llm_provider()
    rag_docs = retrieve_relevant_questions(previous_question_text, role, n_results=3)
    rag_context = "\n".join([d["text"] for d in rag_docs])
    prompt = f"Previous question: {previous_question_text}\nUser answer: {user_answer}\nPrevious score: {previous_score}\nRAG context:\n{rag_context}\n\nGenerate the next interview question as a single JSON object with keys: text, type, difficulty. If this should be a follow-up, make it a brief clarifying question."
    response_text = await llm.generate_text(
        system_prompt=INTERVIEWER_PROMPT,
        user_message=prompt,
        max_tokens=512,
        temperature=0.7,
        response_format="json",
    )
    parsed = json.loads(response_text)
    if isinstance(parsed, list):
        parsed = parsed[0] if parsed else {}
    q_text = parsed.get("text", "")
    if not q_text:
        return None
    return QuestionResponse(
        id=0,
        session_id=session.id,
        question_text=q_text,
        question_type=parsed.get("type", "behavioral"),
        difficulty=parsed.get("difficulty", "medium"),
        order_index=0,
        created_at=str(session.started_at),
    )
