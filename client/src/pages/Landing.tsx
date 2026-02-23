import React from "react";
import { Link } from "wouter";
import { Code2, Terminal, Sparkles, Zap, Shield, ArrowRight, Github } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans overflow-hidden relative">
      {/* Background Effects */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/10 blur-[150px] pointer-events-none" />
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
            <Code2 className="w-6 h-6" />
            <span>Mint<span className="text-foreground">Editor</span></span>
          </div>
          <div className="flex items-center gap-4">
            {isLoading ? null : isAuthenticated ? (
              <Link href="/projects" className="text-sm font-medium hover:text-primary transition-colors">Dashboard</Link>
            ) : (
              <>
                <a href="/api/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Sign In</a>
                <a href="/api/login" className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all">Get Started</a>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center items-center text-center px-4 pt-32 pb-20 z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border/50 text-xs font-medium text-muted-foreground mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>Now with intelligent AI code assistance</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight max-w-4xl text-foreground mb-6 animate-in fade-in slide-in-from-bottom-5 duration-700">
          Code faster with an <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-300">intelligent</span> workspace.
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 leading-relaxed">
          A premium web-based editor featuring native terminal execution, deep AI integration, and multi-language support. Run code instantly in your browser.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-7 duration-700 delay-200">
          <a 
            href="/api/login"
            className="w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-lg flex items-center justify-center gap-2 shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)] hover:shadow-[0_0_60px_-15px_rgba(16,185,129,0.6)] hover:-translate-y-1 transition-all duration-300"
          >
            Start Coding Free <ArrowRight className="w-5 h-5" />
          </a>
          <Link 
            href="/editor/new"
            className="w-full sm:w-auto px-8 py-4 bg-secondary text-foreground rounded-xl font-semibold text-lg flex items-center justify-center gap-2 border border-border/50 hover:bg-secondary/80 hover:border-border transition-all duration-300"
          >
            Try 10-Minute Trial
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mt-32 text-left animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
          {[
            { icon: Terminal, title: "Built-in Terminal", desc: "Execute code instantly in a sandboxed xterm.js environment." },
            { icon: Sparkles, title: "AI Assistant", desc: "Fix bugs, explain errors, and refactor code with a single click." },
            { icon: Zap, title: "Multi-Language", desc: "Support for JS, Python, Rust, Go, and 20+ more languages out of the box." }
          ].map((feature, i) => (
            <div key={i} className="p-6 rounded-2xl bg-card border border-border/40 shadow-lg hover:border-primary/50 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>
      
      <footer className="border-t border-border/40 py-8 text-center text-sm text-muted-foreground z-10 bg-background/50 backdrop-blur-sm">
        <p>© 2024 Mint Editor. Built for developers.</p>
      </footer>
    </div>
  );
}
