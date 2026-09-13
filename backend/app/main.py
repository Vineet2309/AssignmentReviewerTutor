from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import review, questions, sessions, chat
from app.database import get_database

app = FastAPI(
    title="Autonomous Assignment Reviewer & Socratic Tutor API",
    description="Multi-Agent Tutoring Orchestra with Groq Vision, SymPy CAS, and MongoDB persistence",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(review.router)
app.include_router(questions.router)
app.include_router(sessions.router)
app.include_router(chat.router)

@app.on_event("startup")
async def startup_event():
    db = get_database()
    print("FastAPI Backend initialized with MongoDB & Multi-Agent Orchestra.")

@app.get("/")
async def root():
    return {
        "service": "Autonomous Socratic Tutor Multi-Agent Orchestra",
        "status": "online",
        "agents": ["Orchestrator", "Parser Agent (multimodal)", "Verifier Agent (CAS)", "Hint Strategist Agent", "State Manager"]
    }
