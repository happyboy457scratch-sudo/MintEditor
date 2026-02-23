import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { CodeEditor } from "@/components/CodeEditor";
import { Terminal } from "@/components/Terminal";
import { AIPanel } from "@/components/AIPanel";
import { LoginPromptModal } from "@/components/LoginPromptModal";
import { useProject, useUpdateFile, useCreateFile } from "@/hooks/use-projects";
import { useUsage, useTrackUsage } from "@/hooks/use-usage";
import { useAuth } from "@/hooks/use-auth";
import { Code2, Play, Sparkles, Save, FileCode2, ChevronLeft, Download } from "lucide-react";

export default function EditorWorkspace() {
  const params = useParams();
  const projectIdStr = params.id;
  const isNew = projectIdStr === "new";
  const projectId = isNew ? null : parseInt(projectIdStr || "");
  
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { data: usage } = useUsage();
  const trackUsageMutation = useTrackUsage();
  
  const { data: projectData, isLoading: isProjectLoading } = useProject(projectId);
  const updateFileMutation = useUpdateFile();
  const createFileMutation = useCreateFile();

  const [activeFileId, setActiveFileId] = useState<number | null>(null);
  const [localCode, setLocalCode] = useState("");
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [trialExpired, setTrialExpired] = useState(false);

  // Initialize trial for non-auth users
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      if (usage && usage.remainingMinutes !== undefined && usage.remainingMinutes <= 0) {
        setTrialExpired(true);
        setShowLoginPrompt(true);
      } else if (!showLoginPrompt && !trialExpired && !sessionStorage.getItem("loginPromptShown")) {
        setShowLoginPrompt(true);
        sessionStorage.setItem("loginPromptShown", "true");
      }
    }
  }, [isAuthenticated, isAuthLoading, usage, showLoginPrompt, trialExpired]);

  // Usage tracking poll
  useEffect(() => {
    if (trialExpired) return;
    const interval = setInterval(() => {
      trackUsageMutation.mutate(1, {
        onSuccess: (data) => {
          if (!isAuthenticated && data.success === false) {
            setTrialExpired(true);
            setShowLoginPrompt(true);
          }
        }
      });
    }, 60000); // 1 min
    return () => clearInterval(interval);
  }, [isAuthenticated, trialExpired]);

  // Set initial file
  useEffect(() => {
    if (projectData?.files && projectData.files.length > 0 && !activeFileId) {
      const mainFile = projectData.files[0];
      setActiveFileId(mainFile.id);
      setLocalCode(mainFile.content);
    }
  }, [projectData, activeFileId]);

  const activeFile = projectData?.files.find(f => f.id === activeFileId);
  const language = projectData?.project.language || "javascript";

  const handleSave = () => {
    if (!activeFileId) return;
    updateFileMutation.mutate({ id: activeFileId, content: localCode });
  };

  const handleDownload = () => {
    if (!activeFile) return;
    const blob = new Blob([localCode], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile.filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isProjectLoading || isAuthLoading) {
    return <div className="h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!isNew && !projectData) {
    return <div className="h-screen bg-background flex flex-col items-center justify-center text-center"><h2 className="text-2xl font-bold">Project not found</h2><button onClick={()=>setLocation("/projects")} className="mt-4 text-primary">Go to Dashboard</button></div>;
  }

  // Temporary mock for "new" trial mode layout
  const displayCode = isNew ? localCode : localCode;
  const displayLang = isNew ? "javascript" : language;

  return (
    <div className="h-screen w-screen bg-background flex flex-col font-sans overflow-hidden">
      <LoginPromptModal 
        isOpen={showLoginPrompt} 
        onClose={() => !trialExpired && setShowLoginPrompt(false)} 
        isExpired={trialExpired} 
      />

      {/* Header */}
      <header className="h-12 border-b border-border bg-card flex items-center justify-between px-4 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => setLocation("/projects")} className="p-1.5 text-muted-foreground hover:bg-secondary rounded-md transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 text-primary font-bold">
            <Code2 className="w-4 h-4" />
            <span className="hidden sm:inline">MintEditor</span>
          </div>
          <div className="w-px h-4 bg-border mx-2" />
          <span className="text-sm font-medium">{isNew ? "Trial Workspace" : projectData?.project.name}</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Usage Badge */}
          {usage && (
            <div className="hidden sm:flex items-center px-2.5 py-1 rounded-full bg-secondary border border-border/50 text-xs font-medium text-muted-foreground">
              {!isAuthenticated ? (
                <>Trial: <span className={usage.remainingMinutes! <= 2 ? "text-destructive ml-1" : "text-foreground ml-1"}>{usage.remainingMinutes}m left</span></>
              ) : (
                <>Plan: <span className="text-primary ml-1 capitalize">{usage.subscriptionTier.replace('_', ' ')}</span></>
              )}
            </div>
          )}

          <button 
            onClick={handleSave}
            disabled={updateFileMutation.isPending || isNew}
            className="p-1.5 sm:px-3 sm:py-1.5 text-xs font-medium bg-secondary text-foreground rounded-md hover:bg-secondary/80 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Save (Ctrl+S)"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{updateFileMutation.isPending ? "Saving..." : "Save"}</span>
          </button>
          
          <button 
            onClick={() => setShowAIPanel(!showAIPanel)}
            className={`p-1.5 sm:px-3 sm:py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-all ${showAIPanel ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AI Assistant</span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {trialExpired && <div className="absolute inset-0 z-40 bg-background/50 backdrop-blur-sm" />}

        <PanelGroup direction="horizontal">
          {/* Sidebar */}
          <Panel defaultSize={15} minSize={10} maxSize={30} className="border-r border-border bg-card/50">
            <div className="p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/50">Explorer</div>
            <div className="p-2 space-y-1">
              {!isNew && projectData?.files.map(file => (
                <button
                  key={file.id}
                  onClick={() => {
                    setActiveFileId(file.id);
                    setLocalCode(file.content);
                  }}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors ${activeFileId === file.id ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
                >
                  <FileCode2 className="w-4 h-4 opacity-70" />
                  {file.filename}
                </button>
              ))}
              {isNew && (
                <div className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md bg-primary/10 text-primary font-medium">
                  <FileCode2 className="w-4 h-4 opacity-70" />
                  index.js
                </div>
              )}
            </div>
          </Panel>
          
          <PanelResizeHandle className="w-1 bg-border/50 hover:bg-primary/50 transition-colors cursor-col-resize" />

          {/* Editor & Terminal Area */}
          <Panel defaultSize={85}>
            <PanelGroup direction="vertical">
              {/* Editor Pane */}
              <Panel defaultSize={70} className="flex flex-col bg-[#09090b]">
                <div className="h-9 flex items-center justify-between border-b border-border/30 bg-[#09090b] px-2">
                  <div className="flex items-center">
                    <div className="px-4 py-1.5 text-xs font-medium text-primary border-b-2 border-primary bg-primary/5">
                      {isNew ? "index.js" : activeFile?.filename}
                    </div>
                  </div>
                  <button onClick={handleDownload} className="p-1 text-muted-foreground hover:text-foreground transition-colors mr-2" title="Download File">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 relative">
                  <CodeEditor 
                    value={displayCode}
                    language={displayLang}
                    onChange={(val) => setLocalCode(val || "")}
                  />
                </div>
              </Panel>

              <PanelResizeHandle className="h-1 bg-border hover:bg-primary/50 transition-colors cursor-row-resize z-10" />

              {/* Terminal Pane */}
              <Panel defaultSize={30} minSize={10}>
                {!isNew && projectId ? (
                  <Terminal projectId={projectId} />
                ) : (
                  <div className="h-full bg-[#09090b] flex items-center justify-center text-muted-foreground border-t border-border p-4 text-center text-sm">
                    Terminal requires a saved project to execute commands securely. Sign in to enable terminal access.
                  </div>
                )}
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>

        {/* AI Assistant Sidebar (Overlay/Slide-in) */}
        {showAIPanel && (
          <AIPanel 
            code={displayCode} 
            language={displayLang} 
            onApplyFix={(fixedCode) => setLocalCode(fixedCode)}
            onClose={() => setShowAIPanel(false)} 
          />
        )}
      </div>
    </div>
  );
}
