import React, { useState } from "react";
import { Sparkles, X, MessageSquare, AlertCircle, Wand2, Loader2, FileCode2 } from "lucide-react";
import { useAIFixCode, useAIExplainError, useAIImproveCode, useAIGenerateProgram } from "@/hooks/use-ai";
import { useUsage } from "@/hooks/use-usage";

interface AIPanelProps {
  code: string;
  language: string;
  onApplyFix: (code: string) => void;
  onCreateProgram: (filename: string, code: string) => void;
  isCreatingProgram: boolean;
  onClose: () => void;
}

export function AIPanel({ code, language, onApplyFix, onCreateProgram, isCreatingProgram, onClose }: AIPanelProps) {
  const [activeTab, setActiveTab] = useState<"create" | "fix" | "explain" | "improve">("create");
  const [errorInput, setErrorInput] = useState("");
  const [programPrompt, setProgramPrompt] = useState("");
  const [generatedFilename, setGeneratedFilename] = useState("");
  const [generateError, setGenerateError] = useState("");
  const [result, setResult] = useState<any>(null);

  const { data: usage } = useUsage();
  const fixMutation = useAIFixCode();
  const explainMutation = useAIExplainError();
  const improveMutation = useAIImproveCode();
  const generateMutation = useAIGenerateProgram();

  const isPending = fixMutation.isPending || explainMutation.isPending || improveMutation.isPending || generateMutation.isPending;

  const handleAction = () => {
    setResult(null);
    setGenerateError("");
    if (activeTab === "create") {
      generateMutation.mutate(
        { prompt: programPrompt, language },
        {
          onSuccess: (data) => {
            setResult(data);
            setGeneratedFilename(data.filename);
          },
          onError: (error) => setGenerateError(error.message),
        },
      );
      return;
    }
    if (activeTab === "fix") {
      fixMutation.mutate({ code, language, error: errorInput }, {
        onSuccess: (data) => setResult(data)
      });
    } else if (activeTab === "explain") {
      explainMutation.mutate({ code, language, error: errorInput }, {
        onSuccess: (data) => setResult(data)
      });
    } else if (activeTab === "improve") {
      improveMutation.mutate({ code, language }, {
        onSuccess: (data) => setResult(data)
      });
    }
  };

  const hasCredits = usage?.canUseAI;

  return (
    <div className="flex flex-col h-full bg-card border-l border-border w-80 shadow-2xl z-10 relative">
      <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/50">
        <h2 className="flex items-center gap-2 font-semibold text-primary">
          <Sparkles className="w-4 h-4" />
          AI Assistant
        </h2>
        <button onClick={onClose} className="p-1 rounded-md hover:bg-background text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {!hasCredits ? (
        <div className="p-6 flex flex-col items-center justify-center text-center h-full space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <h3 className="font-semibold">AI Features Locked</h3>
          <p className="text-sm text-muted-foreground">
            {!usage?.isAuthenticated 
              ? "Sign in to use AI code assistance features." 
              : "You have run out of AI credits for this month."}
          </p>
          <button 
            onClick={() => window.location.href = `/api/login?redirect=${encodeURIComponent(window.location.pathname)}`}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors hover-elevate"
          >
            {!usage?.isAuthenticated ? "Sign In" : "Upgrade Plan"}
          </button>
        </div>
      ) : (
        <div className="flex flex-col h-full overflow-hidden">
          <div className="flex p-2 gap-1 border-b border-border/50 bg-background/50">
            {[
              { id: "create", label: "Create", icon: FileCode2 },
              { id: "improve", label: "Improve", icon: Wand2 },
              { id: "fix", label: "Fix Code", icon: Sparkles },
              { id: "explain", label: "Explain", icon: MessageSquare },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as typeof activeTab);
                  setResult(null);
                  setGenerateError("");
                }}
                className={`flex-1 py-1.5 px-1 text-[11px] font-medium rounded-md flex items-center justify-center gap-1 transition-colors ${
                  activeTab === tab.id 
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20" 
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <tab.icon className="w-3 h-3" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeTab === "create" && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Describe the program to build ({language})
                </label>
                <textarea
                  value={programPrompt}
                  onChange={(e) => setProgramPrompt(e.target.value)}
                  placeholder="For example: Create a to-do list with add, complete, and delete actions."
                  maxLength={4000}
                  className="w-full bg-background border border-border rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary min-h-[120px] resize-y"
                />
              </div>
            )}

            {(activeTab === "fix" || activeTab === "explain") && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">What error are you seeing? (Optional)</label>
                <textarea 
                  value={errorInput}
                  onChange={(e) => setErrorInput(e.target.value)}
                  placeholder="Paste error message here..."
                  className="w-full bg-background border border-border rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary min-h-[80px] resize-none"
                />
              </div>
            )}

            <button
              onClick={handleAction}
              disabled={isPending || (activeTab === "create" ? programPrompt.trim().length < 3 : !code.trim())}
              className="w-full py-2.5 bg-secondary text-foreground font-medium rounded-lg hover:bg-secondary/80 disabled:opacity-50 transition-all border border-border/50 flex items-center justify-center gap-2 shadow-sm"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-primary" />}
              {isPending ? "Thinking..." : activeTab === "create" ? "Generate Program" : "Run AI Assistant"}
            </button>

            {generateError && activeTab === "create" && (
              <p role="alert" className="text-sm text-destructive">{generateError}</p>
            )}

            {/* Results Display */}
            {result && (
              <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {activeTab === "create" && result.code && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold border-b border-border pb-1">Program generated</h3>
                    <label className="block space-y-1">
                      <span className="text-xs font-medium text-muted-foreground">File name</span>
                      <input
                        value={generatedFilename}
                        onChange={(e) => setGeneratedFilename(e.target.value)}
                        className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        maxLength={100}
                      />
                    </label>
                    <pre className="max-h-56 overflow-auto rounded-lg border border-border bg-background p-3 text-xs leading-relaxed">
                      <code>{result.code}</code>
                    </pre>
                    <button
                      onClick={() => onCreateProgram(generatedFilename.trim(), result.code)}
                      disabled={!generatedFilename.trim() || isCreatingProgram}
                      className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                      {isCreatingProgram ? "Creating File..." : "Create File in Workspace"}
                    </button>
                  </div>
                )}

                {activeTab === "improve" && result.suggestions && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold border-b border-border pb-1">Suggestions</h3>
                    <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-4">
                      {result.suggestions.map((s: string, i: number) => <li key={i}>{s}</li>)}
                    </ul>
                    {result.improvedCode && (
                      <button 
                        onClick={() => onApplyFix(result.improvedCode)}
                        className="w-full mt-2 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"
                      >
                        Apply Improved Code
                      </button>
                    )}
                  </div>
                )}

                {activeTab === "fix" && result.explanation && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold border-b border-border pb-1">Analysis</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{result.explanation}</p>
                    {result.fixedCode && (
                      <button 
                        onClick={() => onApplyFix(result.fixedCode)}
                        className="w-full mt-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                      >
                        Apply Fix
                      </button>
                    )}
                  </div>
                )}

                {activeTab === "explain" && result.explanation && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold border-b border-border pb-1">Explanation</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{result.explanation}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
