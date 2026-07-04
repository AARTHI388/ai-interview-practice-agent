import logging
import asyncio
from typing import List, Dict, Optional
import chromadb
from chromadb.config import Settings as ChromaSettings

logger = logging.getLogger(__name__)

_client = None
_question_collection = None
_answer_collection = None

def _get_client():
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(path="./chroma_db")
    return _client

def _get_question_collection():
    global _question_collection
    if _question_collection is None:
        client = _get_client()
        _question_collection = client.get_or_create_collection(name="interview_question_bank", metadata={"hnsw:space": "cosine"})
    return _question_collection

def _get_answer_collection():
    global _answer_collection
    if _answer_collection is None:
        client = _get_client()
        _answer_collection = client.get_or_create_collection(name="model_answers", metadata={"hnsw:space": "cosine"})
    return _answer_collection

def index_question(question_text: str, metadata: dict) -> str:
    coll = _get_question_collection()
    doc_id = f"q_{metadata.get('session_id', 'global')}_{metadata.get('order_index', 0)}_{hash(question_text)}"
    coll.add(documents=[question_text], metadatas=[metadata], ids=[doc_id])
    return doc_id

def index_model_answer(answer_text: str, metadata: dict) -> str:
    coll = _get_answer_collection()
    doc_id = f"a_{metadata.get('role', 'global')}_{hash(answer_text)}"
    coll.add(documents=[answer_text], metadatas=[metadata], ids=[doc_id])
    return doc_id

def retrieve_relevant_questions(query_text: str, role: str, n_results: int = 5) -> List[dict]:
    coll = _get_question_collection()
    where = {"role": role}
    results = coll.query(query_embeddings=None, query_texts=[query_text], n_results=n_results, where=where)
    docs = []
    if results and results.get("documents"):
        for i, doc in enumerate(results["documents"][0]):
            docs.append({
                "text": doc,
                "metadata": results["metadatas"][0][i] if results.get("metadatas") else {},
                "score": results["distances"][0][i] if results.get("distances") else 0.0,
            })
    return docs

def retrieve_model_answers(query_text: str, role: str, n_results: int = 3) -> List[dict]:
    coll = _get_answer_collection()
    where = {"role": role}
    results = coll.query(query_embeddings=None, query_texts=[query_text], n_results=n_results, where=where)
    docs = []
    if results and results.get("documents"):
        for i, doc in enumerate(results["documents"][0]):
            docs.append({
                "text": doc,
                "metadata": results["metadatas"][0][i] if results.get("metadatas") else {},
                "score": results["distances"][0][i] if results.get("distances") else 0.0,
            })
    return docs
