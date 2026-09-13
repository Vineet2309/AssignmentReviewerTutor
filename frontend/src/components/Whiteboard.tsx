import React, { useRef, useState, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";
import {
  Pencil,
  Highlighter,
  Eraser,
  RotateCcw,
  RotateCw,
  Trash2,
  Type,
  CheckCircle2
} from "lucide-react";

export interface WhiteboardRef {
  getImageDataUrl: () => string;
  clearCanvas: () => void;
  loadBackgroundImage: (dataUrl: string) => void;
  getTextOverride: () => string;
}

interface WhiteboardProps {
  initialQuestion?: string;
  onCheckApproach?: () => void;
  isChecking?: boolean;
}

const COLORS = [
  { name: "White", value: "#ffffff" },
  { name: "Cyan", value: "#38bdf8" },
  { name: "Emerald", value: "#34d399" },
  { name: "Amber", value: "#fbbf24" },
  { name: "Rose", value: "#fb7185" },
  { name: "Purple", value: "#c084fc" },
];

const STROKE_WIDTHS = [
  { label: "Fine", value: 2 },
  { label: "Medium", value: 4 },
  { label: "Bold", value: 8 },
  { label: "Broad", value: 14 },
];

const MATH_SYMBOLS = [
  { label: "d/dx", symbol: "d/dx " },
  { label: "∫", symbol: "∫ " },
  { label: "sin", symbol: "sin(x) " },
  { label: "cos", symbol: "cos(x) " },
  { label: "x²", symbol: "x^2 " },
  { label: "√", symbol: "√(" },
  { label: "π", symbol: "π " },
  { label: "+", symbol: " + " },
  { label: "-", symbol: " - " },
  { label: "·", symbol: " * " },
  { label: "=", symbol: " = " },
];

export const Whiteboard = forwardRef<WhiteboardRef, WhiteboardProps>(({
  onCheckApproach,
  isChecking = false,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tool, setTool] = useState<"pen" | "highlighter" | "eraser">("pen");
  const [color, setColor] = useState<string>("#ffffff");
  const [strokeWidth, setStrokeWidth] = useState<number>(4);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [showTypedSteps, setShowTypedSteps] = useState<boolean>(false);
  const [typedSteps, setTypedSteps] = useState<string>("");
  
  // History stack for Undo/Redo
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Initialize canvas resolution
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const parent = canvas.parentElement;
    if (parent) {
      const rect = parent.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = (rect.height || 540) * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height || 540}px`;
      ctx.scale(dpr, dpr);
    }

    // Fill dark chalkboard background
    ctx.fillStyle = "#0c1322";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid dots background pattern
    ctx.fillStyle = "#1e293b";
    for (let x = 20; x < canvas.width; x += 28) {
      for (let y = 20; y < canvas.height; y += 28) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Save initial state
    const initialImg = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory([initialImg]);
    setHistoryIndex(0);
  }, []);

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const currentImg = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      return [...newHistory, currentImg];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  const undo = () => {
    if (historyIndex <= 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const newIndex = historyIndex - 1;
    ctx.putImageData(history[newIndex], 0, 0);
    setHistoryIndex(newIndex);
  };

  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const newIndex = historyIndex + 1;
    ctx.putImageData(history[newIndex], 0, 0);
    setHistoryIndex(newIndex);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#0c1322";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#1e293b";
    for (let x = 20; x < canvas.width; x += 28) {
      for (let y = 20; y < canvas.height; y += 28) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    setTypedSteps("");
    saveToHistory();
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);

    if (tool === "eraser") {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "#0c1322";
      ctx.lineWidth = strokeWidth * 3;
    } else if (tool === "highlighter") {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = `${color}44`;
      ctx.lineWidth = strokeWidth * 4;
      ctx.lineCap = "square";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }

    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveToHistory();
  };

  const handleInsertSymbol = (sym: string) => {
    setTypedSteps((prev) => prev + sym);
    if (!showTypedSteps) {
      setShowTypedSteps(true);
    }
  };

  useImperativeHandle(ref, () => ({
    getImageDataUrl: () => {
      const canvas = canvasRef.current;
      if (!canvas) return "";
      return canvas.toDataURL("image/png");
    },
    clearCanvas,
    loadBackgroundImage: (dataUrl: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        saveToHistory();
      };
      img.src = dataUrl;
    },
    getTextOverride: () => typedSteps,
  }));

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Whiteboard Toolbar */}
      <div className="bg-slate-900/90 border-b border-slate-800 p-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
          <button
            onClick={() => setTool("pen")}
            title="Pen"
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              tool === "pen" ? "bg-sky-500 text-white shadow-sm" : "text-slate-400 hover:text-white"
            }`}
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTool("highlighter")}
            title="Highlighter"
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              tool === "highlighter" ? "bg-amber-500 text-white shadow-sm" : "text-slate-400 hover:text-white"
            }`}
          >
            <Highlighter className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTool("eraser")}
            title="Eraser"
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              tool === "eraser" ? "bg-rose-500 text-white shadow-sm" : "text-slate-400 hover:text-white"
            }`}
          >
            <Eraser className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-slate-700 mx-1" />
          <button
            onClick={() => setShowTypedSteps(!showTypedSteps)}
            title="Toggle Typed Math Steps"
            className={`p-1.5 rounded-lg transition cursor-pointer flex items-center space-x-1 text-xs font-medium ${
              showTypedSteps ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <Type className="w-4 h-4" />
            <span className="hidden sm:inline">Text Steps</span>
          </button>
        </div>

        {/* Colors */}
        <div className="flex items-center space-x-1.5 bg-slate-800/80 px-2 py-1.5 rounded-xl border border-slate-700/60">
          {COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => {
                setColor(c.value);
                if (tool === "eraser") setTool("pen");
              }}
              title={c.name}
              className={`w-5 h-5 rounded-full transition transform cursor-pointer border ${
                color === c.value && tool !== "eraser" ? "scale-125 border-white ring-2 ring-sky-400/40" : "border-transparent opacity-80 hover:opacity-100"
              }`}
              style={{ backgroundColor: c.value }}
            />
          ))}
        </div>

        {/* Widths */}
        <div className="flex items-center space-x-1 bg-slate-800/80 px-2 py-1 rounded-xl border border-slate-700/60">
          {STROKE_WIDTHS.map((w) => (
            <button
              key={w.value}
              onClick={() => setStrokeWidth(w.value)}
              title={`${w.label} Stroke (${w.value}px)`}
              className={`px-2 py-1 text-xs rounded-md transition cursor-pointer ${
                strokeWidth === w.value ? "bg-sky-500/20 text-sky-300 font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>

        {/* Undo/Redo/Clear */}
        <div className="flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            title="Undo"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            title="Redo"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-slate-700 mx-1" />
          <button
            onClick={clearCanvas}
            title="Clear Whiteboard"
            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Math Stamps */}
      <div className="bg-slate-950/60 border-b border-slate-800/60 px-3 py-1.5 flex items-center space-x-1.5 overflow-x-auto text-xs">
        <span className="text-slate-400 font-medium whitespace-nowrap text-[11px] mr-1">Math Insert:</span>
        {MATH_SYMBOLS.map((sym) => (
          <button
            key={sym.label}
            onClick={() => handleInsertSymbol(sym.symbol)}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-sky-300 font-mono text-[11px] transition whitespace-nowrap cursor-pointer"
          >
            {sym.label}
          </button>
        ))}
      </div>

      {/* Main Canvas Area */}
      <div className="relative flex-1 bg-[#0c1322] overflow-hidden min-h-[440px] flex">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-full cursor-crosshair touch-none"
        />

        {showTypedSteps && (
          <div className="absolute right-3 top-3 bottom-3 w-80 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl p-3 shadow-2xl flex flex-col z-20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-200">Typed Steps Assistant</span>
              <button
                onClick={() => setShowTypedSteps(false)}
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Close
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              Type or paste your math steps (one step per line):
            </p>
            <textarea
              value={typedSteps}
              onChange={(e) => setTypedSteps(e.target.value)}
              placeholder={"Step 1: d/dx [x^2 * sin(x)]\nStep 2: 2*x*sin(x) + x^2*cos(x)"}
              className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500 resize-none"
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-slate-900/95 border-t border-slate-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Interactive Whiteboard Ready (Draw or write steps)</span>
        </div>

        {onCheckApproach && (
          <button
            onClick={onCheckApproach}
            disabled={isChecking}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isChecking ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Orchestrating Agents...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Check My Approach</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
});

Whiteboard.displayName = "Whiteboard";
