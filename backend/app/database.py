from pymongo import MongoClient
import logging
import uuid
import datetime
from app.config import MONGODB_URI, DATABASE_NAME

logger = logging.getLogger(__name__)

client = None
db = None

DEFAULT_QUESTIONS = [
    {
        "id": "q1",
        "title": "Product Rule Differentiation",
        "question_text": "Find the derivative with respect to x: f(x) = x^2 * sin(x)",
        "topic": "Calculus",
        "difficulty": "Intermediate",
        "target": "2*x*sin(x) + x^2*cos(x)",
        "created_at": "2026-09-01T00:00:00Z"
    },
    {
        "id": "q2",
        "title": "Quotient Rule Differentiation",
        "question_text": "Differentiate f(x) = (3x + 1) / (x^2 + 2)",
        "topic": "Calculus",
        "difficulty": "Intermediate",
        "target": "(-3*x^2 - 2*x + 6) / (x^2 + 2)^2",
        "created_at": "2026-09-02T00:00:00Z"
    },
    {
        "id": "q3",
        "title": "Chain Rule with Trigonometry",
        "question_text": "Compute d/dx [ sin(3x^2 + 1) ]",
        "topic": "Calculus",
        "difficulty": "Intermediate",
        "target": "6*x*cos(3*x^2 + 1)",
        "created_at": "2026-09-03T00:00:00Z"
    },
    {
        "id": "q4",
        "title": "Integration by Parts",
        "question_text": "Evaluate indefinite integral: ∫ x * e^x dx",
        "topic": "Calculus",
        "difficulty": "Advanced",
        "target": "x*e^x - e^x",
        "created_at": "2026-09-04T00:00:00Z"
    },
    {
        "id": "q5",
        "title": "Quadratic Factorization",
        "question_text": "Solve for x: x^2 - 5x + 6 = 0",
        "topic": "Algebra",
        "difficulty": "Beginner",
        "target": "x = 2, x = 3",
        "created_at": "2026-09-05T00:00:00Z"
    }
]

# Fallback in-memory storage for questions if MongoDB is unreachable
IN_MEMORY_QUESTIONS = list(DEFAULT_QUESTIONS)

def get_database():
    global client, db
    if db is None:
        try:
            client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=3000)
            client.admin.command("ping")
            db = client[DATABASE_NAME]
            logger.info(f"Connected to MongoDB at {MONGODB_URI}, database: {DATABASE_NAME}")
            seed_initial_questions(db)
        except Exception as e:
            logger.warning(f"MongoDB connection failed: {e}. Running with in-memory questions.")
            db = None
    return db

def seed_initial_questions(database):
    """Seed sample questions only if questions collection is completely empty."""
    try:
        count = database.questions.count_documents({})
        if count == 0:
            database.questions.insert_many([dict(q) for q in DEFAULT_QUESTIONS])
            logger.info("Seeded default questions into MongoDB questions collection.")
    except Exception as e:
        logger.warning(f"Error seeding initial questions: {e}")

def save_question_to_db(question_data: dict) -> dict:
    """Saves ONLY the question into MongoDB. Never stores solutions."""
    if "id" not in question_data:
        question_data["id"] = "q_" + str(uuid.uuid4())[:8]
    if "created_at" not in question_data:
        question_data["created_at"] = datetime.datetime.now().isoformat()

    database = get_database()
    if database is not None:
        try:
            database.questions.insert_one(dict(question_data))
        except Exception as e:
            logger.warning(f"Error saving question to MongoDB: {e}")

    # Also keep in in-memory list
    IN_MEMORY_QUESTIONS.append(question_data)
    # Remove _id if added by pymongo
    question_data.pop("_id", None)
    return question_data

def get_all_questions_from_db():
    """Returns ALL questions stored in MongoDB so the student can solve them again."""
    database = get_database()
    if database is not None:
        try:
            docs = list(database.questions.find({}, {"_id": 0}).sort("created_at", -1))
            if docs:
                return docs
        except Exception as e:
            logger.warning(f"Error fetching questions from MongoDB: {e}")
    return list(reversed(IN_MEMORY_QUESTIONS))

def get_question_by_id(question_id: str):
    database = get_database()
    if database is not None:
        try:
            doc = database.questions.find_one({"id": question_id}, {"_id": 0})
            if doc:
                return doc
        except Exception as e:
            logger.warning(f"Error fetching question {question_id}: {e}")
    for q in IN_MEMORY_QUESTIONS:
        if q.get("id") == question_id:
            return q
    return None
