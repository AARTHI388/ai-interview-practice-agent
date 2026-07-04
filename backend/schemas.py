from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class UserCreate(BaseModel):
    name: str
    email: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    created_at: str

    class Config:
        from_attributes = True

class SessionStartRequest(BaseModel):
    role: str
    job_description: Optional[str] = None
    resume_text: Optional[str] = None
    name: str
    email: Optional[str] = None

class QuestionResponse(BaseModel):
    id: int
    session_id: int
    question_text: str
    question_type: str
    difficulty: str
    order_index: int
    created_at: str

    class Config:
        from_attributes = True

class SessionResponse(BaseModel):
    id: int
    user_id: int
    role: str
    job_description: Optional[str]
    started_at: str
    ended_at: Optional[str]
    overall_score: Optional[float]

    class Config:
        from_attributes = True

class SessionDetailResponse(BaseModel):
    session: SessionResponse
    questions: List[QuestionResponse]

class SessionStartResponse(BaseModel):
    session: SessionResponse
    first_question: Optional[QuestionResponse] = None

class AnswerSubmitRequest(BaseModel):
    question_id: int
    answer_text: str

class FeedbackScores(BaseModel):
    clarity: float
    structure: float
    relevance: float
    technical_accuracy: float
    overall: float

class FeedbackResponse(BaseModel):
    scores: FeedbackScores
    strengths: List[str]
    weaknesses: List[str]
    improvement_tips: List[str]

class NextQuestionResponse(BaseModel):
    feedback: Optional[FeedbackResponse] = None
    next_question: Optional[QuestionResponse] = None
    is_session_ended: bool = False

class SessionEndResponse(BaseModel):
    session: SessionResponse
    summary: str

class ProgressResponse(BaseModel):
    user_id: int
    sessions: List[Dict[str, Any]]

class HealthResponse(BaseModel):
    status: str
