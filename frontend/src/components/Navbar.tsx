import React from "react";
import { Sparkles, Brain, Database, Cpu, Eye, PlusCircle } from "lucide-react";

interface NavbarProps {
  onOpenNewQuestion: () => void;
  onToggleInspector: () => void;
  inspectorOpen: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenNewQuestion,
  onToggleInspector,
  inspectorOpen,
}) => {
  return (
    <header className="bg-slate-900/95 border-b border-slate-800 backdrop-blur-md sticky top-0 z-40 px-4 py-2.5 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white font-bold">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-bold tracking-tight text-white">SocraticMath AI</h1>
            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Multi-Agent Orchestra
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">Autonomous Assignment Reviewer & Socratic Tutor</p>
        </div>
      </div>

      <div className="flex items-center space-x-2.5">
        <div className="hidden lg:flex items-center space-x-2 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700/60 text-xs text-slate-300">
          <span className="flex items-center space-x-1 text-emerald-400 font-medium"><Cpu className="w-3.5 h-3.5" /><span>Parser</span></span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center space-x-1 text-sky-400 font-medium"><Brain className="w-3.5 h-3.5" /><span>CAS Verifier</span></span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center space-x-1 text-amber-400 font-medium"><Sparkles className="w-3.5 h-3.5" /><span>Hint Strategist</span></span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center space-x-1 text-purple-400 font-medium"><Database className="w-3.5 h-3.5" /><span>MongoDB</span></span>
        </div>

        <button
          onClick={onOpenNewQuestion}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition shadow-sm cursor-pointer shadow-sky-600/20"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Question</span>
        </button>

        <button
          onClick={onToggleInspector}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border cursor-pointer ${
            inspectorOpen
              ? "bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-inner"
              : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
          }`}
        >
          <Eye className="w-4 h-4 text-sky-400" />
          <span>Orchestra Inspector</span>
        </button>
      </div>
    </header>
  );
};
