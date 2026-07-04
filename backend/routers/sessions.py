import logging
import json
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.sql import func
from typing import Optional
from database import get_db
from models import User, Session, QuestionAsked, Answer, ProgressHistory
from schemas import SessionStartRequest, SessionStartResponse, SessionResponse, QuestionResponse, AnswerSubmitRequest, NextQuestionResponse, FeedbackResponse, SessionEndResponse, ProgressResponse, HealthResponse
from services.session_service import find_or_create_user, create_session, session_to_response, question_to_response
from services.interview_service import generate_first_questions, generate_follow_up_or_next
from services.grading_service import grade_answer
from llm_provider import get_llm_provider

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/health", response_model=HealthResponse)
async def health():
    return {"status": "ok"}

@router.post("/session/start", response_model=SessionStartResponse)
async def start_session(req: SessionStartRequest, db: AsyncSession = Depends(get_db)):
    if not req.email:
        raise HTTPException(status_code=400, detail="Email is required")
    user = await find_or_create_user(db, req.name, req.email)
    session = await create_session(db, user, req.role, req.job_description, req.resume_text)
    await db.flush()
    questions = await generate_first_questions(session, req.role, req.job_description, req.resume_text, n=5)
    first_question = None
    for q in questions:
        db.add(QuestionAsked(
            session_id=session.id,
            question_text=q.question_text,
            question_type=q.question_type,
            difficulty=q.difficulty,
            order_index=q.order_index,
        ))
        await db.flush()
        if first_question is None:
            first_question = QuestionResponse(
                id=q.id,
                session_id=session.id,
                question_text=q.question_text,
                question_type=q.question_type,
                difficulty=q.difficulty,
                order_index=q.order_index,
                created_at=str(session.started_at),
            )
    await db.commit()
    return SessionStartResponse(session=session_to_response(session), first_question=first_question)

@router.post("/session/{session_id}/answer", response_model=NextQuestionResponse)
async def submit_answer(session_id: int, req: AnswerSubmitRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    q_result = await db.execute(select(QuestionAsked).where(QuestionAsked.id == req.question_id))
    question = q_result.scalar_one_or_none()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    feedback = await grade_answer(question.question_text, req.answer_text, session.role)
    score_json = json.dumps(feedback)
    answer = Answer(question_id=question.id, answer_text=req.answer_text, score_json=score_json, feedback_text=json.dumps(feedback))
    db.add(answer)
    await db.flush()
    ph = ProgressHistory(user_id=session.user_id, session_id=session.id, score=feedback["scores"]["overall"], category="overall")
    db.add(ph)
    question_count_result = await db.execute(select(QuestionAsked).where(QuestionAsked.session_id == session_id))
    all_questions = question_count_result.scalars().all()
    is_ended = len(all_questions) >= 10
    if is_ended:
        session.ended_at = func.now()
        scores = [json.loads(a.score_json)["scores"]["overall"] for a in db.query(Answer).join(QuestionAsked).filter(QuestionAsked.session_id == session_id).all() if a.score_json]
        session.overall_score = sum(scores) / len(scores) if scores else None
        await db.commit()
        return NextQuestionResponse(feedback=FeedbackResponse(**feedback), next_question=None, is_session_ended=True)
    next_q = await generate_follow_up_or_next(question.question_text, req.answer_text, session.role, session, feedback["scores"]["overall"])
    stored_next = None
    if next_q:
        db.add(QuestionAsked(
            session_id=session.id,
            question_text=next_q.question_text,
            question_type=next_q.question_type,
            difficulty=next_q.difficulty,
            order_index=len(all_questions) + 1,
        ))
        await db.flush()
        stored_next = QuestionResponse(
            id=0,
            session_id=session.id,
            question_text=next_q.question_text,
            question_type=next_q.question_type,
            difficulty=next_q.difficulty,
            order_index=len(all_questions) + 1,
            created_at=str(session.started_at),
        )
    await db.commit()
    return NextQuestionResponse(feedback=FeedbackResponse(**feedback), next_question=stored_next, is_session_ended=False)

@router.post("/session/{session_id}/end", response_model=SessionEndResponse)
async def end_session(session_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session.ended_at = func.now()
    answers_result = await db.execute(select(Answer).join(QuestionAsked).where(QuestionAsked.session_id == session_id))
    answers = answers_result.scalars().all()
    scores = []
    for a in answers:
        if a.score_json:
            try:
                scores.append(json.loads(a.score_json)["scores"]["overall"])
            except Exception:
                pass
    session.overall_score = sum(scores) / len(scores) if scores else None
    await db.flush()
    llm = get_llm_provider()
    summary_prompt = f"Generate a concise interview performance summary for role {session.role}. Scores: {scores}. Include strengths, weaknesses, and a 3-step improvement plan."
    summary_text = await llm.generate_text(
        system_prompt="You are a career coach. Output plain text.",
        user_message=summary_prompt,
        max_tokens=512,
        temperature=0.4,
    )
    await db.commit()
    return SessionEndResponse(session=session_to_response(session), summary=summary_text)

@router.get("/session/{session_id}", response_model=SessionDetailResponse)
async def get_session(session_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    questions_result = await db.execute(select(QuestionAsked).where(QuestionAsked.session_id == session_id).order_by(QuestionAsked.order_index))
    questions = questions_result.scalars().all()
    return SessionDetailResponse(
        session=session_to_response(session),
        questions=[question_to_response(q) for q in questions],
    )

@router.get("/users/{user_id}/progress", response_model=ProgressResponse)
async def get_progress(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ProgressHistory).where(ProgressHistory.user_id == user_id).order_by(ProgressHistory.recorded_at))
    history = result.scalars().all()
    sessions = [{"score": h.score, "category": h.category, "recorded_at": str(h.recorded_at)} for h in history]
    return ProgressResponse(user_id=user_id, sessions=sessions)
