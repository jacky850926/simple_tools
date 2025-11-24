"use client";

import { useState, useRef, useEffect } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import {
  ArrowRight,
  Check,
  Copy,
  FileJson,
  Minimize2,
  Trash2,
  AlertCircle,
  Download,
  History,
  X,
  Clock
} from "lucide-react";

interface HistoryItem {
  id: string;
  content: string;
  timestamp: number;
}

export default function Home() {
  const [rawInput, setRawInput] = useState("");
  const [formattedOutput, setFormattedOutput] = useState("");
  const [error, setError] = useState<{ message: string; line?: number; column?: number } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const editorRef = useRef<any>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("json_editor_history");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const addToHistory = (content: string) => {
    setHistory(prev => {
      // Don't add if it's identical to the most recent item
      if (prev.length > 0 && prev[0].content === content) {
        return prev;
      }

      const newItem: HistoryItem = {
        id: crypto.randomUUID(),
        content,
        timestamp: Date.now()
      };

      const newHistory = [newItem, ...prev].slice(0, 100);
      localStorage.setItem("json_editor_history", JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setRawInput(item.content);
    try {
      const parsed = JSON.parse(item.content);
      setFormattedOutput(JSON.stringify(parsed, null, 2));
      setSuccessMessage("Loaded from history");
    } catch (e) {
      setFormattedOutput(item.content);
    }
    setIsHistoryOpen(false);
  };

  const clearHistory = () => {
    if (confirm("Are you sure you want to clear all history?")) {
      setHistory([]);
      localStorage.removeItem("json_editor_history");
    }
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
  };

  const formatJson = () => {
    setError(null);
    setSuccessMessage(null);
    try {
      if (!rawInput.trim()) {
        setFormattedOutput("");
        return;
      }
      const parsed = JSON.parse(rawInput);
      const formatted = JSON.stringify(parsed, null, 2);
      setFormattedOutput(formatted);
      setSuccessMessage("JSON formatted successfully!");
      addToHistory(rawInput); // Save the raw input to history
    } catch (err: any) {
      // Try to extract line/column from error message if possible,
      // though standard JSON.parse doesn't always give it clearly in all browsers.
      // We'll just show the message.
      setError({ message: err.message });
    }
  };

  const validateJson = () => {
    setError(null);
    setSuccessMessage(null);
    try {
      // Get value from editor
      const currentContent = editorRef.current ? editorRef.current.getValue() : formattedOutput;
      if (!currentContent.trim()) return;

      const parsed = JSON.parse(currentContent);
      // Re-format to ensure it's clean
      const formatted = JSON.stringify(parsed, null, 2);
      setFormattedOutput(formatted);
      setSuccessMessage("JSON is valid!");
      addToHistory(formatted); // Save the validated content to history
    } catch (err: any) {
      setError({ message: err.message });
    }
  };

  const minifyJson = () => {
    setError(null);
    setSuccessMessage(null);
    try {
      const currentContent = editorRef.current ? editorRef.current.getValue() : formattedOutput;
      if (!currentContent.trim()) return;

      const parsed = JSON.parse(currentContent);
      const minified = JSON.stringify(parsed);
      setFormattedOutput(minified);
      setSuccessMessage("JSON minified!");
    } catch (err: any) {
      setError({ message: err.message });
    }
  };

  const copyToClipboard = () => {
    const content = editorRef.current ? editorRef.current.getValue() : formattedOutput;
    if (!content) return;
    navigator.clipboard.writeText(content);
    setSuccessMessage("Copied to clipboard!");
    setTimeout(() => setSuccessMessage(null), 2000);
  };

  const clearAll = () => {
    setRawInput("");
    setFormattedOutput("");
    setError(null);
    setSuccessMessage(null);
  };

  const downloadJson = () => {
    const content = editorRef.current ? editorRef.current.getValue() : formattedOutput;
    if (!content) return;

    try {
      // Validate before download
      JSON.parse(content);
      const blob = new Blob([content], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "data.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError({ message: "Cannot download invalid JSON: " + err.message });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans selection:bg-blue-500/30 overflow-hidden">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
              <FileJson className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              JSON Editor
            </h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-neutral-400">
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center gap-2 hover:text-white transition-colors"
            >
              <History className="w-4 h-4" />
              <span>History</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 h-[calc(100vh-4rem)] flex flex-col gap-4 relative">

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-neutral-900/50 p-3 rounded-xl border border-neutral-800 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={formatJson}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-blue-900/20 active:scale-95"
            >
              <ArrowRight className="w-4 h-4" />
              Format
            </button>
            <button
              onClick={validateJson}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
            >
              <Check className="w-4 h-4" />
              Validate
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={minifyJson}
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
              title="Minify"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
            <button
              onClick={downloadJson}
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={copyToClipboard}
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
              title="Copy to Clipboard"
            >
              <Copy className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-neutral-800 mx-1" />
            <button
              onClick={clearAll}
              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
              title="Clear All"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Editors Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">

          {/* Left Panel: Raw Input */}
          <div className="flex flex-col gap-2 min-h-0">
            <div className="flex items-center justify-between px-2">
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Raw Input</label>
              <span className="text-xs text-neutral-600">{rawInput.length} chars</span>
            </div>
            <div className="flex-1 relative group">
              <textarea
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder="Paste your raw JSON here..."
                className="w-full h-full bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 font-mono text-sm text-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent resize-none transition-all placeholder:text-neutral-700"
                spellCheck={false}
              />
              <div className="absolute inset-0 rounded-xl pointer-events-none ring-1 ring-inset ring-white/5 group-hover:ring-white/10 transition-all" />
            </div>
          </div>

          {/* Right Panel: Monaco Editor */}
          <div className="flex flex-col gap-2 min-h-0">
            <div className="flex items-center justify-between px-2">
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Formatted Editor</label>
              {formattedOutput && <span className="text-xs text-neutral-600">Ready</span>}
            </div>
            <div className="flex-1 border border-neutral-800 rounded-xl overflow-hidden bg-[#1e1e1e] shadow-2xl relative">
              <Editor
                height="100%"
                defaultLanguage="json"
                value={formattedOutput}
                onChange={(value) => setFormattedOutput(value || "")}
                onMount={handleEditorDidMount}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  padding: { top: 16, bottom: 16 },
                  scrollBeyondLastLine: false,
                  formatOnPaste: true,
                  automaticLayout: true,
                  tabSize: 2,
                }}
              />
            </div>
          </div>
        </div>

        {/* History Sidebar */}
        {isHistoryOpen && (
          <div className="absolute inset-0 z-50 flex justify-end">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
              onClick={() => setIsHistoryOpen(false)}
            />
            <div className="relative w-full max-w-md bg-neutral-900 border-l border-neutral-800 shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">
              <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-400" />
                  <h2 className="font-bold text-lg">History</h2>
                </div>
                <div className="flex items-center gap-2">
                  {history.length > 0 && (
                    <button
                      onClick={clearHistory}
                      className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-900/20 transition-colors"
                    >
                      Clear All
                    </button>
                  )}
                  <button
                    onClick={() => setIsHistoryOpen(false)}
                    className="p-1 hover:bg-neutral-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {history.length === 0 ? (
                  <div className="text-center text-neutral-500 py-10">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No history yet</p>
                    <p className="text-sm mt-1">Format or validate JSON to save it here</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => loadHistoryItem(item)}
                      className="w-full text-left bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700/50 hover:border-blue-500/30 rounded-lg p-3 transition-all group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-neutral-500 font-mono">
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                        <span className="text-xs bg-neutral-700/50 px-1.5 py-0.5 rounded text-neutral-400">
                          {item.content.length} chars
                        </span>
                      </div>
                      <pre className="text-xs text-neutral-300 font-mono line-clamp-3 opacity-80 group-hover:opacity-100">
                        {item.content.slice(0, 300)}
                      </pre>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Status Bar / Error Display */}
        {(error || successMessage) && (
          <div className={`
            fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl backdrop-blur-md border flex items-center gap-3 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300
            ${error
              ? "bg-red-950/80 border-red-500/30 text-red-200"
              : "bg-emerald-950/80 border-emerald-500/30 text-emerald-200"
            }
          `}>
            {error ? (
              <>
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span className="font-medium">{error.message}</span>
              </>
            ) : (
              <>
                <Check className="w-5 h-5 text-emerald-400" />
                <span className="font-medium">{successMessage}</span>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
