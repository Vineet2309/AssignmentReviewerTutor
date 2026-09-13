import React, { useState, useRef, useEffect } from "react";
import { X, Pencil, Type, Database, Check, Trash2, ArrowRight, Sparkles } from "lucide-react";
import { QuestionItem } from "../types";
import { API_BASE_URL } from "../config";

interface AddQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuestion: (question: QuestionItem) => void;
}

export const AddQuestionModal: React.FC<AddQuestionModalProps> = ({
  isOpen,
  onClose,
  onSelectQuestion,
}) => {
  const [tab, setTab] = useState<"bank" | "whiteboard" | "text">("bank");
  const [dbQuestions, setDbQuestions] = useState<QuestionItem[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState<boolean>(false);

  // New question form state
  const [newTitle, setNewTitle] = useState<string>("");
  const [newText, setNewText] = useState<string>("");
  const [newTopic, setNewTopic] = useState<string>("Calculus");
  const [newDifficulty, setNewDifficulty] = useState<string>("Intermediate");

  // Whiteboard canvas for drawing question
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  const fetchQuestions = () => {
    setIsLoadingQuestions(true);
    fetch(`${API_BASE_URL}/api/questions/list`)
      .then((res) => res.json())
      .then((data) => {
        setDbQuestions(data);
      })
      .catch((err) => {
        console.error("Failed to load questions from database:", err);
      })
      .finally(() => {
        setIsLoadingQuestions(false);
      });
  };

  useEffect(() => {
    if (isOpen) {
      fetchQuestions();
    }
  }, [isOpen]);

  useEffect(() => {
    if (tab === "whiteboard" && isOpen) {
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const parent = canvas.parentElement;
        if (parent) {
          canvas.width = parent.clientWidth;
          canvas.height = 220;
        }

        ctx.fillStyle = "#0c1322";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#1e293b";
        for (let x = 16; x < canvas.width; x += 24) {
          for (let y = 16; y < canvas.height; y += 24) {
            ctx.beginPath();
            ctx.arc(x, y, 1, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }, 50);
    }
  }, [tab, isOpen]);

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDraw = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#0c1322";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleSaveAndSolve = async () => {
    let questionText = newText.trim();
    let whiteboardImage: string | null = null;

    if (tab === "whiteboard") {
      const canvas = canvasRef.current;
      whiteboardImage = canvas ? canvas.toDataURL("image/png") : null;
      if (!questionText) {
        questionText = newTitle.trim() || "Handwritten Problem on Whiteboard";
      }
    }

    if (!questionText) {
      alert("Please provide a question statement or draw it on the whiteboard.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/questions/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim() || "Custom Problem",
          question_text: questionText,
          topic: newTopic,
          difficulty: newDifficulty,
          whiteboard_image: whiteboardImage,
        }),
      });
      const savedQuestion: QuestionItem = await res.json();
      onSelectQuestion(savedQuestion);
      onClose();
    } catch (err) {
      console.error("Error saving question:", err);
      // Fallback
      onSelectQuestion({
        id: "local_" + Date.now(),
        title: newTitle || "Custom Problem",
        question_text: questionText,
        topic: newTopic,
        difficulty: newDifficulty,
        whiteboard_image: whiteboardImage,
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <Database className="w-4 h-4 text-sky-400" />
              <span>Assignment Questions & Question Bank</span>
            </h2>
            <p className="text-[11px] text-slate-400">Select any question from database to solve again, or create a new one</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 p-1.5 gap-1.5">
          <button
            onClick={() => setTab("bank")}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer ${
              tab === "bank"
                ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Question Bank (From Database)</span>
          </button>

          <button
            onClick={() => setTab("whiteboard")}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer ${
              tab === "whiteboard"
                ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Draw Question on Whiteboard</span>
          </button>

          <button
            onClick={() => setTab("text")}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer ${
              tab === "text"
                ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Type New Question</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {/* TAB 1: QUESTION BANK FROM DATABASE */}
          {tab === "bank" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-medium">
                  Select a question to practice on the whiteboard:
                </span>
                <span className="text-[11px] text-slate-400">
                  {dbQuestions.length} Questions in MongoDB
                </span>
              </div>

              {isLoadingQuestions ? (
                <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center space-x-2">
                  <span className="w-3 h-3 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                  <span>Loading questions from database...</span>
                </div>
              ) : dbQuestions.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                  No questions found in database. Create one using the tabs above!
                </div>
              ) : (
                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {dbQuestions.map((q) => (
                    <div
                      key={q.id}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-sky-500/50 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-white group-hover:text-sky-300 transition">
                            {q.title}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-sky-400 font-semibold">
                            {q.topic || "Calculus"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed font-sans">
                          {q.question_text}
                        </p>
                        {q.whiteboard_image && (
                          <div className="pt-1">
                            <span className="text-[10px] text-slate-500 uppercase font-semibold">Handwritten Drawing Attached</span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          onSelectQuestion(q);
                          onClose();
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-sm flex items-center space-x-1.5 shrink-0 cursor-pointer"
                      >
                        <span>Try Question</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DRAW ON WHITEBOARD */}
          {tab === "whiteboard" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-medium">Draw your doubt or assignment question:</span>
                <button
                  onClick={clearCanvas}
                  className="flex items-center space-x-1 text-xs text-rose-400 hover:text-rose-300 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#0c1322] h-52">
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={stopDraw}
                  onMouseLeave={stopDraw}
                  className="w-full h-full cursor-crosshair"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Question Title:</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. My Calculus Doubt 1"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Topic / Subject:</label>
                  <select
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  >
                    <option value="Calculus">Calculus</option>
                    <option value="Algebra">Algebra</option>
                    <option value="Trigonometry">Trigonometry</option>
                    <option value="Physics">Physics</option>
                    <option value="Computer Science">Computer Science</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TYPE QUESTION */}
          {tab === "text" && (
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Question Title:</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Product Rule Exercise"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Question Statement / Equation:</label>
                <textarea
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="e.g. Find the derivative with respect to x: f(x) = x^3 * cos(x)"
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-sky-500 resize-none font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Topic:</label>
                  <select
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  >
                    <option value="Calculus">Calculus</option>
                    <option value="Algebra">Algebra</option>
                    <option value="Trigonometry">Trigonometry</option>
                    <option value="Physics">Physics</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Difficulty:</label>
                  <select
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            Cancel
          </button>
          {tab !== "bank" && (
            <button
              onClick={handleSaveAndSolve}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-md shadow-sky-600/30 flex items-center space-x-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save to Database & Solve</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
