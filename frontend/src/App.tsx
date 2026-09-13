import React, { useState, useRef, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { Whiteboard, WhiteboardRef } from "./components/Whiteboard";
import { TutorPanel } from "./components/TutorPanel";
import { AddQuestionModal } from "./components/AddQuestionModal";
import { OrchestraInspector } from "./components/OrchestraInspector";
import { CheckApproachResponse, QuestionItem } from "./types";
import { API_BASE_URL } from "./config";

export function App() {
  const whiteboardRef = useRef<WhiteboardRef>(null);

  const [sessionId, setSessionId] = useState<string>(() => {
    return "session_" + Math.random().toString(36).substring(2, 9);
  });

  const [currentQuestion, setCurrentQuestion] = useState<string>(
    "Find the derivative with respect to x: f(x) = x^2 * sin(x)"
  );
  const [currentQuestionTitle, setCurrentQuestionTitle] = useState<string>(
    "Product Rule Differentiation"
  );
  const [questionImage, setQuestionImage] = useState<string | null>(null);

  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [lastResponse, setLastResponse] = useState<CheckApproachResponse | null>(null);
  const [isAddQuestionOpen, setIsAddQuestionOpen] = useState<boolean>(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);

  const handleSelectQuestion = (q: QuestionItem) => {
    const newSessionId = "session_" + Math.random().toString(36).substring(2, 9);
    setSessionId(newSessionId);
    setCurrentQuestion(q.question_text);
    setCurrentQuestionTitle(q.title);
    setQuestionImage(q.whiteboard_image || null);
    setLastResponse(null);
    whiteboardRef.current?.clearCanvas();
  };

  const handleCheckApproach = async () => {
    if (isChecking) return;
    setIsChecking(true);

    try {
      const imageData = whiteboardRef.current?.getImageDataUrl() || "";
      const textOverride = whiteboardRef.current?.getTextOverride() || "";

      const res = await fetch(`${API_BASE_URL}/api/review/check-approach`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          question_text: currentQuestion,
          whiteboard_image: imageData,
          text_override: textOverride,
        }),
      });

      if (!res.ok) {
        throw new Error("Review request failed: " + res.statusText);
      }

      const data: CheckApproachResponse = await res.json();
      setLastResponse(data);
    } catch (err: any) {
      console.error("Check approach error:", err);
      // Fallback display if server is unreachable
      setLastResponse({
        session_id: sessionId,
        turn: (lastResponse?.turn || 0) + 1,
        is_solved: false,
        status: "in_progress",
        message: "Solution step captured! Verify backend server is reachable on port 8000.",
        hint: {
          step: 1,
          level: 1,
          text: "Review the governing rule for this question: what property should you apply first?",
          style_name: "Point to the region",
        },
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        onOpenNewQuestion={() => setIsAddQuestionOpen(true)}
        onToggleInspector={() => setIsInspectorOpen(!isInspectorOpen)}
        inspectorOpen={isInspectorOpen}
      />

      {/* Main Split Layout */}
      <main className="flex-1 p-3 md:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-7xl mx-auto w-full">
        {/* Left / Center: Interactive Whiteboard */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col min-h-[580px]">
          <Whiteboard
            ref={whiteboardRef}
            initialQuestion={currentQuestion}
            onCheckApproach={handleCheckApproach}
            isChecking={isChecking}
          />
        </div>

        {/* Right: Socratic Tutor Feedback & Doubt Chat Panel */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col min-h-[580px]">
          <TutorPanel
            currentQuestion={currentQuestion}
            questionTitle={currentQuestionTitle}
            questionImage={questionImage}
            lastResponse={lastResponse}
            onCheckApproach={handleCheckApproach}
            isChecking={isChecking}
            sessionId={sessionId}
          />
        </div>
      </main>

      {/* Question Bank & Add Question Modal */}
      <AddQuestionModal
        isOpen={isAddQuestionOpen}
        onClose={() => setIsAddQuestionOpen(false)}
        onSelectQuestion={handleSelectQuestion}
      />

      {/* Multi-Agent Live Inspector */}
      <OrchestraInspector
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        lastResponse={lastResponse}
        sessionId={sessionId}
      />
    </div>
  );
}

export default App;
