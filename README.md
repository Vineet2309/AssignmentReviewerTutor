# SocraticMath AI — Autonomous Assignment Reviewer & Socratic Tutor

An intelligent, multi-model agent tutoring platform built with **React**, **FastAPI**, and **MongoDB**. Designed to guide students through math and problem-solving assignments by diagnosing handwriting and whiteboard steps, verifying transformations with SymPy CAS, and providing adaptive Socratic hints — **never giving away the answer outright** until the student masters it or reaches the hint limit.

---

## Architecture & Multi-Model Orchestra

```
                                 ┌───────────────────────────────────┐
                                 │       React Student Frontend      │
                                 │   • Interactive Whiteboard        │
                                 │   • Question Bank (from MongoDB)  │
                                 │   • Socratic Tutor Panel          │
                                 │   • Multi-Agent Live Inspector    │
                                 └─────────────────┬─────────────────┘
                                                   │ POST /api/review/check-approach
                                                   ▼
                                 ┌───────────────────────────────────┐
                                 │         FastAPI Backend           │
                                 │      Orchestrator Controller      │
                                 └─────────────────┬─────────────────┘
                                                   │
          ┌────────────────────────────────────────┼────────────────────────────────────────┐
          ▼                                        ▼                                        ▼
┌───────────────────────────┐            ┌───────────────────────────┐            ┌───────────────────────────┐
│ 1. Image-to-Text Model    │            │  2. Review & CAS Engine   │            │   3. Socratic Tutor       │
│ • Model: qwen/qwen3.8-27b │ ──Steps──► │ • Model: gpt-oss-120b     │ ──Diag───► │ • 6-Level Hint Ladder     │
│ • Transcribes whiteboard  │            │ • SymPy CAS verification  │            │ • Identifies last correct │
│ • LaTeX & math steps      │            │ • Diagnoses rule & sign   │            │ • Halts hints if solved   │
└───────────────────────────┘            └───────────────────────────┘            └───────────────────────────┘
                                                   │
                                                   ▼
                                         ┌───────────────────┐
                                         │  MongoDB Database │
                                         │  • questions only │
                                         │  • NO solutions   │
                                         └───────────────────┘
```

### Models Configured
- **Vision Model (Image-to-Text)**: `qwen/qwen3.8-27b`
- **Text Model (Review & Socratic Tutor)**: `openai/gpt-oss-120b`
- **Symbolic Verification Engine**: SymPy Computer Algebra System (CAS)
- **Database**: MongoDB (`questions` collection)

---

## Core Workflow & Features

1. **Whiteboard Solution Submission**:
   - The student works out mathematical or algorithmic steps directly on an interactive canvas whiteboard with pen, highlighter, eraser, math symbol stamps ($d/dx, \int, \sin, \cos, x^2, \sqrt{}, \pi$), and an optional typed steps assistant.
2. **Image-to-Text Transcription (`qwen/qwen3.8-27b`)**:
   - The canvas image is sent to the vision model to transcribe handwritten strokes into ordered text/LaTeX steps.
3. **LLM Review & CAS Verification (`openai/gpt-oss-120b` + SymPy)**:
   - The review model analyzes the extracted steps against the problem statement.
   - **If the solution is correct**: Immediately flags `status: solved` and displays **"Correct Solution!"** with confetti. **No further hints are generated**.
   - **If the solution is not correct**: Identifies the last step the user was correct on, isolates the error, and provides a focused Socratic hint for the question after that step.
4. **Adaptive Escalation & Hint Limit**:
   - Hints follow an escalation ladder (Level 1: Point to region $\to$ Level 5: Partial formula reveal).
   - If the student is stuck and reaches the hint limit (6 turns), the system provides the **complete step-by-step correct solution** to unblock them.
5. **Question Bank (from MongoDB)**:
   - **Privacy & Storage Policy**: **Only questions** are stored in MongoDB. Student solutions and stroke drawings are never stored in the database.
   - Students can browse all questions stored in MongoDB (including custom questions drawn on the whiteboard) and click **"Try Question"** to solve or re-solve any problem at any time.
6. **Socratic Doubt Solving Chat**:
   - Real-time chat drawer where students can ask doubts and receive Socratic nudges strictly adhering to pedagogical rules ($\le 2$ sentences, question-first).
7. **Multi-Agent Live Inspector**:
   - Slide-out debugging inspector showing the exact transcription, SymPy CAS notes, and LLM deliberation.

---

## Environment Configuration

All URLs, models, and connection strings are managed through environment variables (no hardcoded endpoints).

### `.env` Setup (Root / Backend)
```env
# AI Models
TEXT_MODEL=openai/gpt-oss-120b
VISION_MODEL=qwen/qwen3.8-27b

# API Key & optional Base URL (supports Groq, OpenRouter, or OpenAI-compatible endpoints)
GROQ_API_KEY=your_groq_api_key_here
OPENAI_API_KEY=
AI_API_KEY=
AI_BASE_URL=

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=socratic_tutor
MAX_HINT_LIMIT=6

# Frontend Backend Connection URL
VITE_API_BASE_URL=http://localhost:8000
```

### `frontend/.env`
```env
VITE_API_BASE_URL=http://localhost:8000
```

---

## Quickstart & Installation

### Prerequisites
- Node.js (v18+) & npm
- Python (v3.10+)
- MongoDB (running locally on port 27017 or via Atlas)

### 1. Start MongoDB
```powershell
mongod
# Or if installed as a service on Windows:
Start-Service MongoDB
```

### 2. Start FastAPI Backend
```powershell
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API docs available at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 3. Start React Frontend
```powershell
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```
Open application: [http://127.0.0.1:5173/](http://127.0.0.1:5173/)

---

## Future Roadmap: Multi-Language Programming Code Analyzer (LeetCode-Style)

We are actively expanding SocraticMath AI into a comprehensive **Code Reviewer & Socratic Programming Tutor**, bringing LeetCode-style algorithmic problem solving with real-time compilation, isolated sandbox execution, and Socratic debugging for multiple programming languages.

### 1. Multi-Language Support
- **Python**: Dynamic execution, PEP-8 linting, AST inspection.
- **Java**: Bytecode compilation (`javac`), JVM sandboxing, object-oriented design feedback.
- **C++ (C++17/20)**: High-performance compilation (`g++` / `clang++`), memory safety checks with AddressSanitizer (ASan).
- **C (C11/C99)**: Pointer manipulation analysis, buffer overflow detection, memory leak detection via Valgrind.

### 2. Isolated Execution Sandbox
- Sandboxed execution architecture using secure containerized workers (Docker / gVisor / WebAssembly / Judge0).
- Strict resource constraints (timeout limits: 2 seconds, memory limits: 256MB) to safely prevent infinite loops or harmful system calls.
- Automated test suite execution: Hidden edge cases, stress tests ($N = 10^5$), and custom test input runners.

### 3. Socratic Programming Nudges (Beyond Basic Errors)
- **Syntax & Compilation**: Rather than dumping a compiler traceback, the Socratic tutor highlights the offending line with a conceptual question (e.g. *"Notice the semicolon or type mismatch on line 14 — what type does this function expect?"*).
- **Runtime & Edge Cases**:
  - Null pointer / segmentation faults (*"What happens when the input array is empty or has only one element?"*).
  - Off-by-one errors (*"Check your loop boundary condition — does index `i` exceed `len - 1`?"*).
  - Integer overflow in C/C++/Java (*"Could the sum of two large 32-bit integers exceed `INT_MAX`?"*).
- **Time & Space Complexity Optimization**:
  - Flags suboptimal algorithms: e.g. $O(N^2)$ brute force where $O(N \log N)$ or $O(N)$ is required.
  - Socratic complexity nudge: *"Can you avoid the nested loop by trading space for time using a Hash Map or Two-Pointer approach?"*
- **Algorithmic Hint Ladder**:
  - Level 1: Point to bottleneck or failed edge case.
  - Level 2: Name algorithmic paradigm (e.g. Dynamic Programming, Binary Search, Sliding Window).
  - Level 3: Targeted invariant question.
  - Level 4: Worked analogous mini-problem.
  - Level 5: Partial pseudo-code skeleton.
  - Level 6: Full annotated reference solution with complexity breakdown.

---

## License
MIT License. Built for advanced agentic AI learning and education.
