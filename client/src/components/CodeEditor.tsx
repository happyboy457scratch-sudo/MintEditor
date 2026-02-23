import React from "react";
import Editor, { useMonaco } from "@monaco-editor/react";

interface CodeEditorProps {
  value: string;
  language: string;
  onChange: (value: string | undefined) => void;
  readOnly?: boolean;
}

export function CodeEditor({ value, language, onChange, readOnly = false }: CodeEditorProps) {
  const monaco = useMonaco();

  React.useEffect(() => {
    if (monaco) {
      monaco.editor.defineTheme("mint-dark", {
        base: "vs-dark",
        inherit: true,
        rules: [
          { token: "comment", foreground: "6272a4", fontStyle: "italic" },
          { token: "keyword", foreground: "10b981", fontStyle: "bold" },
          { token: "string", foreground: "f1fa8c" },
          { token: "number", foreground: "bd93f9" },
          { token: "function", foreground: "50fa7b" },
        ],
        colors: {
          "editor.background": "#09090b",
          "editor.foreground": "#f8f8f2",
          "editorLineNumber.foreground": "#44475a",
          "editorIndentGuide.background": "#2a2a35",
          "editor.selectionBackground": "#44475a",
          "editor.lineHighlightBackground": "#2a2a35",
          "editorCursor.foreground": "#10b981",
        },
      });
      monaco.editor.setTheme("mint-dark");
    }
  }, [monaco]);

  return (
    <Editor
      height="100%"
      language={language}
      value={value}
      onChange={onChange}
      theme="mint-dark"
      options={{
        minimap: { enabled: true },
        fontSize: 14,
        fontFamily: "var(--font-mono)",
        wordWrap: "on",
        lineHeight: 24,
        padding: { top: 16, bottom: 16 },
        readOnly,
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        cursorBlinking: "smooth",
        cursorSmoothCaretAnimation: "on",
      }}
      loading={
        <div className="flex items-center justify-center h-full w-full bg-background text-muted-foreground">
          Loading editor...
        </div>
      }
    />
  );
}
