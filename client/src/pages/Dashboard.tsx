import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useProjects, useCreateProject, useDeleteProject } from "@/hooks/use-projects";
import { Code2, Plus, Trash2, Clock, Settings, LogOut, TerminalSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const { data: projects, isLoading: isProjectsLoading } = useProjects();
  const createMutation = useCreateProject();
  const deleteMutation = useDeleteProject();
  const [, setLocation] = useLocation();

  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectLang, setNewProjectLang] = useState("javascript");

  if (isAuthLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  if (!isAuthenticated) {
    window.location.href = "/api/login";
    return null;
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    
    createMutation.mutate({ name: newProjectName, language: newProjectLang }, {
      onSuccess: (data) => {
        setIsCreating(false);
        setNewProjectName("");
        setLocation(`/editor/${data.id}`);
      }
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Navigation */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-primary font-bold text-lg">
            <Code2 className="w-5 h-5" />
            <span>Mint<span className="text-foreground">Editor</span></span>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link href="/settings" className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
            </Link>
            <div className="h-8 w-px bg-border/50 mx-2" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 text-primary font-bold text-sm uppercase overflow-hidden">
                {user?.profileImageUrl ? <img src={user.profileImageUrl} alt="Profile" /> : user?.email?.charAt(0) || "U"}
              </div>
              <a href="/api/logout" className="text-sm font-medium text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1.5">
                <LogOut className="w-4 h-4" />
                Sign Out
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your Projects</h1>
            <p className="text-muted-foreground mt-1">Manage and jump back into your code.</p>
          </div>
          <button 
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>

        {isCreating && (
          <div className="mb-8 p-6 rounded-2xl bg-card border border-primary/30 shadow-[0_0_30px_-10px_rgba(16,185,129,0.15)] animate-in fade-in slide-in-from-top-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><TerminalSquare className="w-5 h-5 text-primary"/> Create New Project</h2>
            <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-4">
              <input 
                type="text" 
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                placeholder="Project Name"
                className="flex-1 bg-background border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                autoFocus
              />
              <select 
                value={newProjectLang}
                onChange={e => setNewProjectLang(e.target.value)}
                className="bg-background border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="html">HTML/CSS</option>
                <option value="rust">Rust</option>
                <option value="go">Go</option>
              </select>
              <div className="flex gap-2">
                <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 border border-border rounded-lg text-muted-foreground hover:bg-secondary transition-colors">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {createMutation.isPending ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        )}

        {isProjectsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="h-40 rounded-2xl bg-card animate-pulse border border-border/50" />)}
          </div>
        ) : projects?.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-border border-dashed">
            <Code2 className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold">No projects yet</h3>
            <p className="text-muted-foreground mt-1">Create your first project to start coding.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects?.map(project => (
              <div key={project.id} className="group relative p-6 rounded-2xl bg-card border border-border/60 hover:border-primary/50 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 flex flex-col">
                <Link href={`/editor/${project.id}`} className="absolute inset-0 z-0" />
                
                <div className="flex items-start justify-between mb-4 z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <TerminalSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg line-clamp-1">{project.name}</h3>
                      <p className="text-xs font-mono text-muted-foreground">{project.language}</p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      if(confirm("Delete this project?")) deleteMutation.mutate(project.id);
                    }}
                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="mt-auto pt-4 flex items-center gap-2 text-xs text-muted-foreground border-t border-border/30 z-10">
                  <Clock className="w-3.5 h-3.5" />
                  Updated {formatDistanceToNow(new Date(project.updatedAt))} ago
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
