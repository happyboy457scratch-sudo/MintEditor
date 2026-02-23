import React from "react";
import { X, Code2, Sparkles, Clock, LogIn } from "lucide-react";

interface LoginPromptModalProps {
  onClose: () => void;
  isOpen: boolean;
  isExpired?: boolean;
}

export function LoginPromptModal({ onClose, isOpen, isExpired = false }: LoginPromptModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-card border border-border shadow-2xl rounded-2xl overflow-hidden glass-panel animate-in zoom-in-95 duration-300">
        {!isExpired && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-secondary transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        
        <div className="p-8 flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-primary/30 shadow-lg shadow-primary/20">
            {isExpired ? (
              <Clock className="w-8 h-8 text-primary" />
            ) : (
              <Code2 className="w-8 h-8 text-primary" />
            )}
          </div>
          
          <h2 className="text-2xl font-bold mb-2 text-foreground">
            {isExpired ? "Time's up!" : "Welcome to Mint Editor"}
          </h2>
          
          <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
            {isExpired 
              ? "Your 10-minute trial has expired. Sign in for free to save your work, continue coding, and access AI features."
              : "Sign in to save your projects and access powerful AI features, or continue as a guest for a 10-minute trial."}
          </p>
          
          <div className="w-full space-y-3">
            <button 
              onClick={() => window.location.href = `/api/login?redirect=${encodeURIComponent(window.location.pathname)}`}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              <LogIn className="w-4 h-4" />
              Sign In with Replit
            </button>
            
            {!isExpired && (
              <button 
                onClick={onClose}
                className="w-full py-3 text-muted-foreground font-medium rounded-xl hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                Try for 10 minutes
              </button>
            )}
          </div>
          
          <div className="mt-8 grid grid-cols-2 gap-4 w-full text-left pt-6 border-t border-border/50">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-primary mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-foreground">AI Assistant</h4>
                <p className="text-[10px] text-muted-foreground">Fix bugs & explain code</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Code2 className="w-4 h-4 text-primary mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-foreground">Unlimited Saves</h4>
                <p className="text-[10px] text-muted-foreground">Cloud project storage</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
