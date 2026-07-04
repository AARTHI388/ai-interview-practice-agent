import logging
import json
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models import User, Session, QuestionAsked, Answer, ProgressHistory
from schemas import SessionStartRequest, SessionStartResponse, QuestionResponse, AnswerSubmitRequest, NextQuestionResponse, FeedbackResponse, SessionEndResponse, SessionResponse
import httpx

logger = logging.getLogger(__name__)

async def find_or_create_user(db: AsyncSession, name: str, email: str) -> User:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user:
        return user
    user = User(name=name, email=email)
    db.add(user)
    await db.flush()
    return user

async def create_session(db: AsyncSession, user: User, role: str, job_description: Optional[str], resume_text: Optional[str]) -> Session:
    session = Session(user_id=user.id, role=role, job_description=job_description, resume_text=resume_text)
    db.add(session)
    await db.flush()
    return session

def session_to_response(session: Session) -> SessionResponse:
    return SessionResponse(
        id=session.id,
        user_id=session.user_id,
        role=session.role,
        job_description=session.job_description,
        started_at=str(session.started_at),
        ended_at=str(session.ended_at) if session.ended_at else None,
        overall_score=session.overall_score,
    )

def question_to_response(q: QuestionAsked) -> QuestionResponse:
    return QuestionResponse(
        id=q.id,
        session_id=q.session_id,
        question_text=q.question_text,
        question_type=q.question_type,
        difficulty=q.difficulty,
        order_index=q.order_index,
        created_at=str(q.created_at),
    )
