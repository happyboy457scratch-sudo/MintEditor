import React, { useEffect, useRef } from "react";
import { Terminal as XTerm } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";
import { useTerminalExecute } from "@/hooks/use-terminal";
import { Play, RotateCcw } from "lucide-react";

interface TerminalProps {
  projectId: number;
}

export function Terminal({ projectId }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  
  const executeMutation = useTerminalExecute();
  
  // Initialize XTerm
  useEffect(() => {
    if (!terminalRef.current) return;
    
    const term = new XTerm({
      theme: {
        background: '#09090b',
        foreground: '#fafafa',
        cursor: '#10b981',
        selectionBackground: 'rgba(16, 185, 129, 0.3)',
      },
      fontFamily: 'var(--font-mono)',
      fontSize: 14,
      cursorBlink: true,
      disableStdin: false,
    });
    
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    
    term.open(terminalRef.current);
    fitAddon.fit();
    
    term.writeln('\x1b[1;32m Mint Editor Terminal\x1b[0m');
    term.writeln(' Type a command and press Enter...');
    term.write('\r\n$ ');
    
    xtermRef.current = term;
    fitAddonRef.current = fitAddon;
    
    let currentInput = '';
    
    term.onData((data) => {
      const code = data.charCodeAt(0);
      if (code === 13) { // Enter
        term.write('\r\n');
        if (currentInput.trim()) {
          executeMutation.mutate({ projectId, command: currentInput }, {
            onSuccess: (res) => {
              if (res.output) term.write(res.output.replace(/\n/g, '\r\n') + '\r\n');
              if (res.error) term.write('\x1b[31m' + res.error.replace(/\n/g, '\r\n') + '\x1b[0m\r\n');
              term.write('$ ');
            },
            onError: (err) => {
              term.write(`\x1b[31mError: ${err.message}\x1b[0m\r\n$ `);
            }
          });
        } else {
          term.write('$ ');
        }
        currentInput = '';
      } else if (code === 127) { // Backspace
        if (currentInput.length > 0) {
          term.write('\b \b');
          currentInput = currentInput.slice(0, -1);
        }
      } else {
        currentInput += data;
        term.write(data);
      }
    });
    
    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, [projectId]);

  return (
    <div className="flex flex-col h-full bg-background border-t border-border">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-secondary/30">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <RotateCcw className="w-3 h-3" />
          Terminal
        </h3>
        <button 
          onClick={() => {
            xtermRef.current?.clear();
            xtermRef.current?.write('$ ');
          }}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear
        </button>
      </div>
      <div className="flex-1 overflow-hidden p-2" ref={terminalRef} />
    </div>
  );
}
