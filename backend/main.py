from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import os
from routers import sessions, health

logger = logging.getLogger(__name__)
app = FastAPI(title="AI Interview Practice Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sessions.router, prefix="/api")
app.include_router(health.router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "AI Interview Practice Agent API"}
