import React, { useState } from "react";
import { X, Cpu, Brain, Sparkles, Database, Layers } from "lucide-react";
import { CheckApproachResponse } from "../types";

interface OrchestraInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  lastResponse?: CheckApproachResponse | null;
  sessionId: string;
}

export const OrchestraInspector: React.FC<OrchestraInspectorProps> = ({
  isOpen,
  onClose,
  lastResponse,
  sessionId,
}) => {
  const [activeTab, setActiveTab] = useState<"pipeline" | "parser" | "verifier" | "hint" | "state">("pipeline");

  if (!isOpen) return null;

  const trace = lastResponse?.trace;
  const parser = trace?.parser;
  const verifier = trace?.verifier;
  const hintStrategy = trace?.hint_strategy;
  const stateUpdate = trace?.state_update;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col backdrop-blur-md">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Multi-Agent Orchestra Live Inspector</h2>
            <p className="text-[11px] text-slate-400 font-mono">Session: {sessionId.slice(0, 16)}...</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/50 px-3 pt-2 gap-1 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab("pipeline")}
          className={`px-3 py-1.5 rounded-t-lg font-medium transition cursor-pointer ${
            activeTab === "pipeline" ? "bg-slate-900 text-sky-400 border-t-2 border-sky-500 font-bold" : "text-slate-400 hover:text-white"
          }`}
        >
          Workflow Loop
        </button>
        <button
          onClick={() => setActiveTab("parser")}
          className={`px-3 py-1.5 rounded-t-lg font-medium transition cursor-pointer flex items-center space-x-1 ${
            activeTab === "parser" ? "bg-slate-900 text-emerald-400 border-t-2 border-emerald-500 font-bold" : "text-slate-400 hover:text-white"
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>1. Parser</span>
        </button>
        <button
          onClick={() => setActiveTab("verifier")}
          className={`px-3 py-1.5 rounded-t-lg font-medium transition cursor-pointer flex items-center space-x-1 ${
            activeTab === "verifier" ? "bg-slate-900 text-sky-400 border-t-2 border-sky-500 font-bold" : "text-slate-400 hover:text-white"
          }`}
        >
          <Brain className="w-3.5 h-3.5" />
          <span>2. Verifier (CAS)</span>
        </button>
        <button
          onClick={() => setActiveTab("hint")}
          className={`px-3 py-1.5 rounded-t-lg font-medium transition cursor-pointer flex items-center space-x-1 ${
            activeTab === "hint" ? "bg-slate-900 text-amber-400 border-t-2 border-amber-500 font-bold" : "text-slate-400 hover:text-white"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>3. Hint Strategist</span>
        </button>
        <button
          onClick={() => setActiveTab("state")}
          className={`px-3 py-1.5 rounded-t-lg font-medium transition cursor-pointer flex items-center space-x-1 ${
            activeTab === "state" ? "bg-slate-900 text-purple-400 border-t-2 border-purple-500 font-bold" : "text-slate-400 hover:text-white"
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>4. State (MongoDB)</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 font-mono text-xs">
        {activeTab === "pipeline" && (
          <div className="space-y-4 font-sans">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Autonomous Orchestration Workflow</h3>
            
            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">1</div>
                <div>
                  <h4 className="font-bold text-slate-200">Ingest: Multimodal Parser Agent</h4>
                  <p className="text-slate-400 text-[11px]">Transcribes whiteboard strokes to ordered steps in LaTeX + OCR confidence.</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center shrink-0">2</div>
                <div>
                  <h4 className="font-bold text-slate-200">Verify: Tool-Using CAS Agent (SymPy)</h4>
                  <p className="text-slate-400 text-[11px]">Tests transformation step_n to step_n+1 using SymPy CAS symbolic_calc & code sandbox.</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">3</div>
                <div>
                  <h4 className="font-bold text-slate-200">Decide: Hint Strategist Escalation</h4>
                  <p className="text-slate-400 text-[11px]">Selects smallest useful Socratic intervention along the 6-level ladder without giving away answers.</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 font-bold flex items-center justify-center shrink-0">4</div>
                <div>
                  <h4 className="font-bold text-slate-200">Persist: State Manager (MongoDB)</h4>
                  <p className="text-slate-400 text-[11px]">Updates session document, turn history, and error repetition counters in MongoDB.</p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <span className="text-[11px] font-bold text-slate-300">Active Turn Status:</span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-500">Status: </span>
                  <span className="text-sky-300 font-bold">{lastResponse?.status || "Ready"}</span>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-500">Turn Number: </span>
                  <span className="text-white font-bold">{lastResponse?.turn || 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "parser" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-bold text-emerald-400 flex items-center space-x-1.5"><Cpu className="w-4 h-4" /><span>Parser Strict JSON Output</span></span>
              <span>Model: llama-3.2-11b-vision-preview</span>
            </div>
            <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-emerald-300 overflow-x-auto text-[11px]">
              {JSON.stringify(parser || { message: "No parser output yet. Click 'Check My Approach'." }, null, 2)}
            </pre>
          </div>
        )}

        {activeTab === "verifier" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-bold text-sky-400 flex items-center space-x-1.5"><Brain className="w-4 h-4" /><span>Verifier Agent (SymPy CAS)</span></span>
              <span>Verified By: {verifier?.verified_by || "symbolic_calc"}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-300">
                <span>First Error Step:</span>
                <span className="text-rose-400 font-bold">{verifier?.first_error_step ? `Step ${verifier.first_error_step}` : "None"}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Error Type:</span>
                <span className="text-amber-400 font-bold">{verifier?.error_type || "None"}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Is Mathematically Valid:</span>
                <span className={verifier?.is_correct ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {String(verifier?.is_correct ?? true)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800">
                <span className="text-slate-400 text-[10px] block mb-1">INTERNAL DIAGNOSTIC NOTE (NEVER SHOWN TO STUDENT DIRECTLY):</span>
                <p className="p-2 bg-slate-900 rounded border border-slate-800 text-amber-200 text-xs">
                  {verifier?.internal_note || "All steps verified successfully with CAS."}
                </p>
              </div>
            </div>
            <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-sky-300 overflow-x-auto text-[11px]">
              {JSON.stringify(verifier || {}, null, 2)}
            </pre>
          </div>
        )}

        {activeTab === "hint" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-bold text-amber-400 flex items-center space-x-1.5"><Sparkles className="w-4 h-4" /><span>Hint Strategist Escalation Ladder</span></span>
              <span>Model: llama-3.3-70b-versatile</span>
            </div>
            <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-amber-300 overflow-x-auto text-[11px]">
              {JSON.stringify(hintStrategy || { message: "No hint generated yet." }, null, 2)}
            </pre>
          </div>
        )}

        {activeTab === "state" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-bold text-purple-400 flex items-center space-x-1.5"><Database className="w-4 h-4" /><span>MongoDB Persisted State Document</span></span>
              <span>Database: socratic_tutor.sessions</span>
            </div>
            <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-purple-300 overflow-x-auto text-[11px]">
              {JSON.stringify(stateUpdate || { session_id: sessionId, status: "in_progress" }, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
