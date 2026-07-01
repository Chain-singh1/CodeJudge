import Editor from "@monaco-editor/react";

const MONACO_LANG = {
  javascript: "javascript",
  python: "python",
  java: "java",
  cpp: "cpp",
};

const CodeEditor = ({ language, code, onChange }) => {
  return (
    <Editor
      height="100%"
      language={MONACO_LANG[language] || "javascript"}
      value={code}
      onChange={(val) => onChange(val || "")}
      theme="vs-dark"
      options={{
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
        fontLigatures: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: "on",
        automaticLayout: true,
        tabSize: 2,
        lineNumbers: "on",
        renderLineHighlight: "line",
        padding: { top: 12, bottom: 12 },
        cursorBlinking: "smooth",
        smoothScrolling: true,
        contextmenu: false,
        scrollbar: {
          verticalScrollbarSize: 6,
          horizontalScrollbarSize: 6,
        },
      }}
    />
  );
};

export default CodeEditor;
