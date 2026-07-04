import asyncio
import logging
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from models import Base, User, Session, QuestionAsked, ProgressHistory
from services.rag_service import index_question, index_model_answer, _get_client

logger = logging.getLogger(__name__)
engine = create_async_engine("sqlite+aiosqlite:///./interview_agent.db", echo=False)
async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

QUESTIONS = [
    {"text": "Tell me about yourself and your experience.", "type": "behavioral", "difficulty": "easy", "role": "Software Engineer", "industry": "Technology"},
    {"text": "What is a variable in programming?", "type": "technical", "difficulty": "easy", "role": "Software Engineer", "industry": "Technology"},
    {"text": "Explain the difference between a list and a tuple.", "type": "technical", "difficulty": "easy", "role": "Software Engineer", "industry": "Technology"},
    {"text": "Describe a time you had to learn a new technology quickly.", "type": "behavioral", "difficulty": "easy", "role": "Software Engineer", "industry": "Technology"},
    {"text": "What is the time complexity of binary search?", "type": "technical", "difficulty": "medium", "role": "Software Engineer", "industry": "Technology"},
    {"text": "Explain RESTful API design principles.", "type": "technical", "difficulty": "medium", "role": "Software Engineer", "industry": "Technology"},
    {"text": "Tell me about a challenging bug you resolved.", "type": "behavioral", "difficulty": "medium", "role": "Software Engineer", "industry": "Technology"},
    {"text": "How do you handle conflicting priorities?", "type": "behavioral", "difficulty": "medium", "role": "Software Engineer", "industry": "Technology"},
    {"text": "Explain database indexing and when you would use it.", "type": "technical", "difficulty": "medium", "role": "Software Engineer", "industry": "Technology"},
    {"text": "Describe the CAP theorem.", "type": "technical", "difficulty": "hard", "role": "Software Engineer", "industry": "Technology"},
    {"text": "How would you design a URL shortening service?", "type": "technical", "difficulty": "hard", "role": "Software Engineer", "industry": "Technology"},
    {"text": "Tell me about a time you led a technical project.", "type": "behavioral", "difficulty": "hard", "role": "Software Engineer", "industry": "Technology"},
    {"text": "Explain microservices vs monolith architecture.", "type": "technical", "difficulty": "medium", "role": "Software Engineer", "industry": "Technology"},
    {"text": "What is your approach to code reviews?", "type": "behavioral", "difficulty": "easy", "role": "Software Engineer", "industry": "Technology"},
    {"text": "How do you ensure code quality?", "type": "technical", "difficulty": "medium", "role": "Software Engineer", "industry": "Technology"},
    {"text": "Describe a time you improved a legacy system.", "type": "behavioral", "difficulty": "medium", "role": "Software Engineer", "industry": "Technology"},
    {"text": "Explain the actor model in concurrent programming.", "type": "technical", "difficulty": "hard", "role": "Software Engineer", "industry": "Technology"},
    {"text": "What interests you about backend engineering?", "type": "behavioral", "difficulty": "easy", "role": "Software Engineer", "industry": "Technology"},
    {"text": "How do you debug a performance issue in production?", "type": "technical", "difficulty": "hard", "role": "Software Engineer", "industry": "Technology"},
    {"text": "Tell me about a time you mentored a junior engineer.", "type": "behavioral", "difficulty": "medium", "role": "Software Engineer", "industry": "Technology"},
    {"text": "What is a pivot table in Excel or data analysis?", "type": "technical", "difficulty": "easy", "role": "Data Analyst", "industry": "Technology"},
    {"text": "Describe your process for analyzing a dataset.", "type": "behavioral", "difficulty": "easy", "role": "Data Analyst", "industry": "Technology"},
    {"text": "Explain the difference between correlation and causation.", "type": "technical", "difficulty": "medium", "role": "Data Analyst", "industry": "Technology"},
    {"text": "Tell me about a time your analysis changed a business decision.", "type": "behavioral", "difficulty": "medium", "role": "Data Analyst", "industry": "Technology"},
    {"text": "How do you handle missing data?", "type": "technical", "difficulty": "medium", "role": "Data Analyst", "industry": "Technology"},
    {"text": "What is A/B testing and when do you use it?", "type": "technical", "difficulty": "medium", "role": "Data Analyst", "industry": "Technology"},
    {"text": "Describe a time you had to present complex findings to non-technical stakeholders.", "type": "behavioral", "difficulty": "medium", "role": "Data Analyst", "industry": "Technology"},
    {"text": "Explain SQL window functions with an example.", "type": "technical", "difficulty": "hard", "role": "Data Analyst", "industry": "Technology"},
    {"text": "How do you validate your data analysis results?", "type": "technical", "difficulty": "medium", "role": "Data Analyst", "industry": "Technology"},
    {"text": "Tell me about a dashboard you built and its impact.", "type": "behavioral", "difficulty": "medium", "role": "Data Analyst", "industry": "Technology"},
    {"text": "What is your experience with statistical modeling?", "type": "technical", "difficulty": "hard", "role": "Data Analyst", "industry": "Technology"},
    {"text": "How do you prioritize multiple analysis requests?", "type": "behavioral", "difficulty": "easy", "role": "Data Analyst", "industry": "Technology"},
    {"text": "Explain cohort analysis and give an example.", "type": "technical", "difficulty": "medium", "role": "Data Analyst", "industry": "Technology"},
    {"text": "Tell me about a time you found an insight that nobody else saw.", "type": "behavioral", "difficulty": "hard", "role": "Data Analyst", "industry": "Technology"},
    {"text": "What is the product lifecycle?", "type": "behavioral", "difficulty": "easy", "role": "Product Manager", "industry": "Technology"},
    {"text": "How do you decide what to build next?", "type": "behavioral", "difficulty": "medium", "role": "Product Manager", "industry": "Technology"},
    {"text": "Explain user story mapping.", "type": "technical", "difficulty": "medium", "role": "Product Manager", "industry": "Technology"},
    {"text": "Tell me about a product you shipped and the results.", "type": "behavioral", "difficulty": "medium", "role": "Product Manager", "industry": "Technology"},
    {"text": "How do you measure product success?", "type": "technical", "difficulty": "medium", "role": "Product Manager", "industry": "Technology"},
    {"text": "Describe a time you had to say no to a stakeholder request.", "type": "behavioral", "difficulty": "medium", "role": "Product Manager", "industry": "Technology"},
    {"text": "Explain OKRs and how you use them.", "type": "technical", "difficulty": "medium", "role": "Product Manager", "industry": "Technology"},
    {"text": "How do you conduct user research?", "type": "behavioral", "difficulty": "easy", "role": "Product Manager", "industry": "Technology"},
    {"text": "Tell me about a product failure and what you learned.", "type": "behavioral", "difficulty": "hard", "role": "Product Manager", "industry": "Technology"},
    {"text": "What is your approach to product roadmap planning?", "type": "behavioral", "difficulty": "hard", "role": "Product Manager", "industry": "Technology"},
    {"text": "How do you work with engineering teams?", "type": "behavioral", "difficulty": "easy", "role": "Product Manager", "industry": "Technology"},
    {"text": "Explain prioritization frameworks like RICE.", "type": "technical", "difficulty": "medium", "role": "Product Manager", "industry": "Technology"},
    {"text": "Tell me about a time you used data to make a product decision.", "type": "behavioral", "difficulty": "medium", "role": "Product Manager", "industry": "Technology"},
    {"text": "What is consultative selling?", "type": "behavioral", "difficulty": "easy", "role": "Sales Representative", "industry": "Sales"},
    {"text": "Describe your sales process from lead to close.", "type": "behavioral", "difficulty": "medium", "role": "Sales Representative", "industry": "Sales"},
    {"text": "How do you handle objections from prospects?", "type": "behavioral", "difficulty": "medium", "role": "Sales Representative", "industry": "Sales"},
    {"text": "Tell me about your largest deal.", "type": "behavioral", "difficulty": "hard", "role": "Sales Representative", "industry": "Sales"},
    {"text": "What CRM tools have you used?", "type": "technical", "difficulty": "easy", "role": "Sales Representative", "industry": "Sales"},
    {"text": "How do you qualify leads?", "type": "behavioral", "difficulty": "medium", "role": "Sales Representative", "industry": "Sales"},
    {"text": "Explain SPIN selling.", "type": "technical", "difficulty": "medium", "role": "Sales Representative", "industry": "Sales"},
    {"text": "Tell me about a time you lost a deal and what you learned.", "type": "behavioral", "difficulty": "medium", "role": "Sales Representative", "industry": "Sales"},
    {"text": "How do you stay organized with multiple accounts?", "type": "behavioral", "difficulty": "easy", "role": "Sales Representative", "industry": "Sales"},
    {"text": "Describe a time you exceeded your quota.", "type": "behavioral", "difficulty": "medium", "role": "Sales Representative", "industry": "Sales"},
    {"text": "What is your approach to cold outreach?", "type": "behavioral", "difficulty": "medium", "role": "Sales Representative", "industry": "Sales"},
    {"text": "How do you build long-term client relationships?", "type": "behavioral", "difficulty": "hard", "role": "Sales Representative", "industry": "Sales"},
    {"text": "Tell me about a time you turned around an unhappy client.", "type": "behavioral", "difficulty": "hard", "role": "Sales Representative", "industry": "Sales"},
    {"text": "What metrics do you track in sales?", "type": "technical", "difficulty": "medium", "role": "Sales Representative", "industry": "Sales"},
    {"text": "How do you handle a pricing objection?", "type": "behavioral", "difficulty": "medium", "role": "Sales Representative", "industry": "Sales"},
    {"text": "Describe a time you collaborated with marketing.", "type": "behavioral", "difficulty": "easy", "role": "Sales Representative", "industry": "Sales"},
    {"text": "What is a linked list and when would you use it?", "type": "technical", "difficulty": "medium", "role": "Software Engineer", "industry": "Technology"},
    {"text": "Explain SOLID principles.", "type": "technical", "difficulty": "hard", "role": "Software Engineer", "industry": "Technology"},
    {"text": "Describe a time you improved system performance.", "type": "behavioral", "difficulty": "medium", "role": "Software Engineer", "industry": "Technology"},
    {"text": "What is test-driven development?", "type": "technical", "difficulty": "medium", "role": "Software Engineer", "industry": "Technology"},
    {"text": "How do you approach system design?", "type": "technical", "difficulty": "hard", "role": "Software Engineer", "industry": "Technology"},
    {"text": "Tell me about a time you resolved a conflict with a teammate.", "type": "behavioral", "difficulty": "medium", "role": "Software Engineer", "industry": "Technology"},
    {"text": "What is a data lake?", "type": "technical", "difficulty": "medium", "role": "Data Analyst", "industry": "Technology"},
    {"text": "Describe a time you had to work with incomplete data.", "type": "behavioral", "difficulty": "medium", "role": "Data Analyst", "industry": "Technology"},
    {"text": "How do you communicate uncertainty in your analysis?", "type": "behavioral", "difficulty": "hard", "role": "Data Analyst", "industry": "Technology"},
    {"text": "What is a minimum viable product?", "type": "technical", "difficulty": "easy", "role": "Product Manager", "industry": "Technology"},
    {"text": "Tell me about a feature you built from 0 to 1.", "type": "behavioral", "difficulty": "medium", "role": "Product Manager", "industry": "Technology"},
]

MODEL_ANSWERS = [
    {"text": "I identified a payment bug, patched the race condition, added monitoring, and wrote a post-mortem. We reduced incidents by 80%.", "role": "Software Engineer", "question_type": "behavioral"},
    {"text": "Binary search has O(log n) time complexity because it halves the search space each step. It requires the array to be sorted.", "role": "Software Engineer", "question_type": "technical"},
    {"text": "I loaded the data in pandas, inspected nulls with df.isnull().sum(), imputed missing numeric values with the median, and documented assumptions.", "role": "Data Analyst", "question_type": "technical"},
    {"text": "I mapped features to company OKRs and used RICE scoring. We shipped the top 3 and saw a 20% lift in activation.", "role": "Product Manager", "question_type": "behavioral"},
    {"text": "I focus on understanding the client's pain point first, then tailor the demo to their specific use case rather than giving a generic pitch.", "role": "Sales Representative", "question_type": "behavioral"},
]

async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with async_session() as session:
        user = User(name="Demo User", email="demo@example.com")
        session.add(user)
        await session.flush()
        session_obj = Session(user_id=user.id, role="Software Engineer", job_description="Full-stack role", resume_text="Experienced developer")
        session.add(session_obj)
        await session.flush()
        for idx, q in enumerate(QUESTIONS[:10], start=1):
            session.add(QuestionAsked(session_id=session_obj.id, question_text=q["text"], question_type=q["type"], difficulty=q["difficulty"], order_index=idx))
            index_question(q["text"], {"role": q["role"], "industry": q["industry"], "difficulty": q["difficulty"], "question_type": q["type"], "session_id": session_obj.id, "order_index": idx})
        await session.commit()
        for ma in MODEL_ANSWERS:
            index_model_answer(ma["text"], {"role": ma["role"], "question_type": ma["question_type"]})
        for score in [6.5, 7.2, 8.0]:
            session.add(ProgressHistory(user_id=user.id, session_id=session_obj.id, score=score, category="overall"))
        await session.commit()
    logger.info("Database seeded with %d questions and %d model answers", len(QUESTIONS[:10]), len(MODEL_ANSWERS))

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(seed())
