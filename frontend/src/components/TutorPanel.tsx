import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Award,
  Send,
  Bot,
  Lightbulb,
  BookOpenCheck
} from "lucide-react";
import { CheckApproachResponse, HintGiven } from "../types";
import { API_BASE_URL } from "../config";

interface TutorPanelProps {
  currentQuestion: string;
  questionTitle?: string;
  questionImage?: string | null;
  lastResponse?: CheckApproachResponse | null;
  onCheckApproach: () => void;
  isChecking: boolean;
  sessionId: string;
}

const HINT_LADDER_STYLES: Record<number, { title: string; color: string }> = {
  1: { title: "Point to the region", color: "from-blue-500 to-cyan-500" },
  2: { title: "Name the concept, not the fix", color: "from-cyan-500 to-teal-500" },
  3: { title: "Targeted question", color: "from-amber-500 to-yellow-500" },
  4: { title: "Worked analogous example", color: "from-orange-500 to-amber-600" },
  5: { title: "Partial reveal", color: "from-rose-500 to-pink-500" },
  6: { title: "Full explanation & solution", color: "from-purple-500 to-indigo-600" },
};

export const TutorPanel: React.FC<TutorPanelProps> = ({
  currentQuestion,
  questionTitle,
  questionImage,
  lastResponse,
  onCheckApproach,
  isChecking,
  sessionId,
}) => {
  const [chatInput, setChatInput] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "student" | "tutor"; text: string }>>([
    {
      sender: "tutor",
      text: "Write your solution on the whiteboard and click 'Check My Approach' to verify your steps.",
    },
  ]);
  const [isAskingDoubt, setIsAskingDoubt] = useState<boolean>(false);

  // Trigger celebratory confetti when solved
  useEffect(() => {
    if (lastResponse?.is_solved) {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  }, [lastResponse?.is_solved]);

  const handleSendDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isAskingDoubt) return;

    const query = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { sender: "student", text: query }]);
    setIsAskingDoubt(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/chat/doubt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          message: query,
          question_text: currentQuestion,
        }),
      });
      const data = await res.json();
      setChatMessages((prev) => [
        ...prev,
        { sender: "tutor", text: data.reply || "Consider how the fundamental mathematical rule applies to that term." },
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { sender: "tutor", text: "Look closely at the components in that step. What would happen if you evaluated each term individually?" },
      ]);
    } finally {
      setIsAskingDoubt(false);
    }
  };

  const isSolved = lastResponse?.is_solved === true;
  const isLimitReached = lastResponse?.status === "limit_reached";
  const hint: HintGiven | undefined = (!isSolved && !isLimitReached) ? (lastResponse?.hint ?? undefined) : undefined;

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Current Question Pinned Header */}
      <div className="bg-slate-900/90 border-b border-slate-800 p-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold tracking-wider uppercase text-sky-400">
            {questionTitle || "Active Question"}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
            {isSolved ? "✅ Solved" : isLimitReached ? "📖 Solution Revealed" : `Turn ${lastResponse?.turn || 1}`}
          </span>
        </div>
        <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 text-sm text-slate-100 font-medium">
          {questionImage ? (
            <div className="space-y-2">
              <p className="text-xs text-slate-400">Handwritten Question Snapshot:</p>
              <img src={questionImage} alt="Handwritten Question" className="max-h-28 rounded-lg border border-slate-800 object-contain bg-[#0c1322]" />
              <p className="text-xs text-slate-300 font-sans">{currentQuestion}</p>
            </div>
          ) : (
            <p className="leading-relaxed font-sans">{currentQuestion}</p>
          )}
        </div>
      </div>

      {/* Main Feedback & Guidance Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* CASE 1: SOLVED / CORRECT SOLUTION (NO FURTHER HINTS) */}
        {isSolved && (
          <div className="bg-gradient-to-br from-emerald-950/90 to-teal-900/70 border-2 border-emerald-500/70 rounded-xl p-4 shadow-xl shadow-emerald-500/10 space-y-2">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-emerald-500/30">
                <Award className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-emerald-300">Correct Solution!</h3>
                <p className="text-xs text-emerald-100 leading-relaxed">
                  {lastResponse?.message || "Your steps and final answer are verified and correct."}
                </p>
                <div className="pt-2 flex items-center space-x-2 text-[11px] text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verified with Symbolic CAS Engine</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CASE 2: HINT LIMIT REACHED - FULL RIGHT SOLUTION REVEALED */}
        {isLimitReached && lastResponse?.full_solution && (
          <div className="bg-gradient-to-br from-indigo-950/90 to-purple-950/80 border-2 border-purple-500/60 rounded-xl p-4 shadow-xl space-y-3">
            <div className="flex items-center space-x-2 text-purple-300 font-bold text-xs">
              <BookOpenCheck className="w-4 h-4" />
              <span>Full Right Solution Revealed (Hint Limit Reached)</span>
            </div>
            <p className="text-xs text-slate-300">
              {lastResponse.message}
            </p>
            <div className="bg-slate-950 border border-purple-900/50 rounded-lg p-3 text-xs text-purple-200 font-mono whitespace-pre-wrap leading-relaxed">
              {lastResponse.full_solution}
            </div>
          </div>
        )}

        {/* CASE 3: IN PROGRESS WITH SOCRATIC HINT */}
        {!isSolved && !isLimitReached && hint && (
          <div className="bg-slate-950/90 border border-amber-500/40 rounded-xl p-4 shadow-lg shadow-amber-500/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                  L{hint.level}
                </span>
                <span className="text-xs font-bold text-amber-300">
                  {HINT_LADDER_STYLES[hint.level]?.title || hint.style_name || "Socratic Hint"}
                </span>
              </div>
              {lastResponse?.last_correct_step && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  Last Correct: Step {lastResponse.last_correct_step}
                </span>
              )}
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 leading-relaxed font-sans">
              <p className="font-medium">{hint.text}</p>
            </div>

            {/* Hint Ladder Progress */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Hint Escalation Ladder</span>
                <span>Level {hint.level} of 6</span>
              </div>
              <div className="grid grid-cols-6 gap-1 h-1.5">
                {[1, 2, 3, 4, 5, 6].map((lvl) => (
                  <div
                    key={lvl}
                    className={`rounded-full transition ${
                      lvl <= hint.level ? "bg-amber-400 shadow-sm shadow-amber-400/50" : "bg-slate-800"
                    }`}
                  />
                ))}
              </div>
              <p className="text-[10px] text-slate-500 italic">
                If stuck after 6 hints, the complete solution will be revealed automatically.
              </p>
            </div>
          </div>
        )}

        {/* Socratic Doubt Solver Chat */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex flex-col h-60 shadow-inner">
          <div className="flex items-center space-x-1.5 mb-2 pb-2 border-b border-slate-800 text-xs font-semibold text-slate-300">
            <Bot className="w-4 h-4 text-sky-400" />
            <span>Ask Tutor a Doubt (Socratic Q&A)</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-lg max-w-[88%] leading-relaxed ${
                  msg.sender === "student"
                    ? "ml-auto bg-sky-600 text-white"
                    : "mr-auto bg-slate-900 border border-slate-800 text-slate-200"
                }`}
              >
                {msg.text}
              </div>
            ))}
            {isAskingDoubt && (
              <div className="mr-auto bg-slate-900 border border-slate-800 text-slate-400 p-2 rounded-lg text-xs flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                <span>Thinking Socratically...</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSendDoubt} className="mt-2 pt-2 border-t border-slate-800 flex items-center space-x-1.5">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask a doubt about this problem..."
              className="flex-1 bg-slate-900 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            />
            <button
              type="submit"
              disabled={isAskingDoubt || !chatInput.trim()}
              className="p-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Primary Action Button Footer */}
      <div className="bg-slate-900/90 border-t border-slate-800 p-3">
        <button
          onClick={onCheckApproach}
          disabled={isChecking}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-sky-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 cursor-pointer"
        >
          {isChecking ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Reviewing Solution via Multi-Agent Orchestra...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-sky-200" />
              <span>Check My Approach</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
