import logging
import json
from typing import Dict, Any
from llm_provider import get_llm_provider
from services.rag_service import retrieve_model_answers
from prompts import load_prompt

logger = logging.getLogger(__name__)

GRADER_PROMPT = load_prompt("system_grader")

def _parse_feedback(raw: str) -> Dict[str, Any]:
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        logger.error("Failed to parse grader JSON: %s", raw[:200])
        raise
    scores = data.get("scores", {})
    return {
        "scores": {
            "clarity": float(scores.get("clarity", 0)),
            "structure": float(scores.get("structure", 0)),
            "relevance": float(scores.get("relevance", 0)),
            "technical_accuracy": float(scores.get("technical_accuracy", 0)),
            "overall": float(scores.get("overall", 0)),
        },
        "strengths": data.get("strengths", []),
        "weaknesses": data.get("weaknesses", []),
        "improvement_tips": data.get("improvement_tips", []),
    }

async def grade_answer(question_text: str, answer_text: str, role: str) -> Dict[str, Any]:
    llm = get_llm_provider()
    model_examples = retrieve_model_answers(question_text, role, n_results=2)
    rag_context = "\n".join([m["text"] for m in model_examples])
    prompt = GRADER_PROMPT.format(rag_context=rag_context, question_text=question_text, answer_text=answer_text)
    for attempt in range(3):
        try:
            response_text = await llm.generate_text(
                system_prompt="You are a strict but fair interview grader. Output valid JSON only.",
                user_message=prompt,
                max_tokens=1024,
                temperature=0.2,
                response_format="json",
            )
            return _parse_feedback(response_text)
        except Exception as e:
            logger.warning("Grading attempt %d failed: %s", attempt + 1, e)
            prompt = prompt + "\n\nYour previous response was not valid JSON. Output ONLY a valid JSON object matching the schema."
    raise RuntimeError("Failed to grade answer after 3 attempts")
