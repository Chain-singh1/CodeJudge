import { useEffect, useState, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import CodeEditor from "../components/CodeEditor";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import { runTestCases, judgeViaBackend } from "../services/codeRunner";

const STARTER = {
  javascript: `function solve(a, b) {\n  // write your solution here\n  \n}`,
  python: `def solve(*args):\n    # write your solution here\n    pass`,
  java: `public class Solution {\n    public Object solve(int a, int b) {\n        // write your solution here\n        return null;\n    }\n}`,
  cpp: `auto solve(int a, int b) {\n    // write your solution here\n    \n}`,
};

const LANG_LABELS = {
  javascript: "JavaScript",
  python: "Python",
  java: "Java",
  cpp: "C++",
};

const diffStyle = {
  Easy: "text-green-400 bg-green-950",
  Medium: "text-yellow-400 bg-yellow-950",
  Hard: "text-red-400 bg-red-950",
};

const storageKey = (pid, lang) => `cj_code_${pid}_${lang}`;
const langKey = (pid) => `cj_lang_${pid}`;
const saveCode = (pid, lang, code) => {
  try {
    localStorage.setItem(storageKey(pid, lang), code);
  } catch (_) {}
};
const loadCode = (pid, lang) => {
  try {
    return localStorage.getItem(storageKey(pid, lang));
  } catch (_) {
    return null;
  }
};
const saveLang = (pid, lang) => {
  try {
    localStorage.setItem(langKey(pid), lang);
  } catch (_) {}
};
const loadLang = (pid) => {
  try {
    return localStorage.getItem(langKey(pid));
  } catch (_) {
    return null;
  }
};

// ── AI Assistant ─────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  {
    id: "hint",
    label: "💡 Get a hint",
    prompt:
      "Give me a hint for this problem without revealing the solution. Be concise.",
  },
  {
    id: "debug",
    label: "🐛 Debug my code",
    prompt:
      "Look at my code and the problem. Tell me what is wrong and why, without giving the full correct solution.",
  },
  {
    id: "approach",
    label: "📖 Explain approach",
    prompt:
      "Explain the best algorithmic approach to solve this problem. Mention time and space complexity but do not write the full code.",
  },
];

const AIAssistant = ({ problem, code, language, open, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const buildSystemPrompt = () =>
    `
You are an expert coding assistant embedded in CodeJudge, a competitive programming platform.
The user is solving this problem:
TITLE: ${problem?.title || "Unknown"}
DIFFICULTY: ${problem?.difficulty || "Unknown"}
DESCRIPTION: ${problem?.description || ""}
Their current code (${language}):
\`\`\`${language}
${code}
\`\`\`
Rules:
- NEVER give the complete working solution
- For hints: give a nudge only
- For debugging: point out the issue but let them fix it
- For approach: explain conceptually, mention complexity, no full code
- Be concise — 3 to 6 sentences max
- Use plain text, minimal markdown
`.trim();

  const sendMessage = async (userMessage) => {
    if (!userMessage.trim() || streaming) return;
    const newMessages = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
    try {
      const token = localStorage.getItem("token");
      const baseUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${baseUrl}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          system: buildSystemPrompt(),
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Request failed");
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) throw new Error(parsed.error);
            const delta = parsed.delta?.text || "";
            if (delta) {
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: updated[updated.length - 1].content + delta,
                };
                return updated;
              });
            }
          } catch (e) {
            if (e.message !== "Unexpected end of JSON input") throw e;
          }
        }
      }
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && !last.content) {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...last,
            content:
              "No response received. Check your GEMINI_API_KEY in the backend .env file.",
          };
          return updated;
        }
        return prev;
      });
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: `Error: ${err.message}`,
        };
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  };

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-40 flex justify-end pointer-events-none">
      <div
        className="absolute inset-0 bg-black bg-opacity-40 pointer-events-auto"
        onClick={onClose}
      />
      <div className="relative w-full sm:w-[400px] h-full bg-[#13151f] border-l border-gray-700 flex flex-col pointer-events-auto shadow-2xl">
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-xs">
              ✦
            </div>
            <span className="text-sm font-semibold text-white">
              AI Assistant
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="space-y-4">
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full bg-green-900 flex items-center justify-center text-2xl mx-auto mb-3">
                  ✦
                </div>
                <p className="text-sm font-medium text-gray-200">
                  Need help with this problem?
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  I won't give away the answer — just guide you.
                </p>
              </div>
              <div className="space-y-2">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => sendMessage(action.prompt)}
                    disabled={streaming}
                    className="w-full text-left px-4 py-3 rounded-xl bg-[#1a1d27] border border-gray-800 hover:border-green-800 hover:bg-[#1e2535] text-sm text-gray-300 transition-all disabled:opacity-50"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-green-700 text-white rounded-br-sm"
                      : "bg-[#1a1d27] border border-gray-800 text-gray-200 rounded-bl-sm"
                  }`}
                >
                  {msg.content || (
                    <span className="flex gap-1 items-center text-gray-500">
                      <span
                        className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
        {messages.length > 0 && (
          <div className="flex-shrink-0 flex gap-2 px-4 py-2 border-t border-gray-800 overflow-x-auto">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.id}
                onClick={() => sendMessage(action.prompt)}
                disabled={streaming}
                className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors disabled:opacity-50"
              >
                {action.label.split(" ").slice(0, 2).join(" ")}
              </button>
            ))}
          </div>
        )}
        <div className="flex-shrink-0 p-3 border-t border-gray-800">
          <div className="flex items-end gap-2 bg-[#1a1d27] border border-gray-700 rounded-xl px-3 py-2 focus-within:border-green-600 transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              disabled={streaming}
              placeholder="Ask anything about this problem…"
              rows={1}
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none resize-none leading-relaxed disabled:opacity-50"
              style={{ maxHeight: 120 }}
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height =
                  Math.min(e.target.scrollHeight, 120) + "px";
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || streaming}
              className="flex-shrink-0 w-7 h-7 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            >
              <svg
                className="w-3.5 h-3.5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 12h14M12 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
          <p className="text-[10px] text-gray-600 mt-1.5 text-center">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
};

// ── Description content (shared between desktop panel and mobile tab) ──
const DescriptionContent = ({ problem, tab, setTab, submissions }) => (
  <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-5">
    {tab === "description" && (
      <div className="space-y-5">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold mb-3">
            {problem.title}
          </h1>
          <div className="flex gap-2 flex-wrap">
            <span
              className={`text-xs px-2.5 py-1 rounded-lg font-medium ${diffStyle[problem.difficulty]}`}
            >
              {problem.difficulty}
            </span>
            {problem.tags?.map((tag, i) => (
              <span
                key={i}
                className="text-xs px-2.5 py-1 rounded-lg bg-gray-800 text-gray-400"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <p className="text-gray-300 text-sm leading-7">{problem.description}</p>
        {(problem.inputExample || problem.outputExample) && (
          <div>
            <h3 className="text-sm font-semibold mb-2 text-gray-200">
              Example
            </h3>
            <div className="bg-[#1a1d27] border border-gray-800 rounded-xl p-4 text-sm font-mono space-y-1.5">
              {problem.inputExample && (
                <p>
                  <span className="text-gray-500">Input:&nbsp;&nbsp;</span>
                  <span className="text-white">{problem.inputExample}</span>
                </p>
              )}
              {problem.outputExample && (
                <p>
                  <span className="text-gray-500">Output: </span>
                  <span className="text-white">{problem.outputExample}</span>
                </p>
              )}
            </div>
          </div>
        )}
        {problem.sampleTestCases?.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2 text-gray-200">
              Sample Test Cases
            </h3>
            <div className="space-y-2">
              {problem.sampleTestCases.map((tc, i) => (
                <div
                  key={i}
                  className="bg-[#1a1d27] border border-gray-800 rounded-xl p-4 text-sm font-mono space-y-1.5"
                >
                  <p>
                    <span className="text-gray-500">Input:&nbsp;&nbsp;</span>
                    <span className="text-white">{tc.input}</span>
                  </p>
                  <p>
                    <span className="text-gray-500">Output: </span>
                    <span className="text-white">{tc.expectedOutput}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        {problem.constraints && (
          <div>
            <h3 className="text-sm font-semibold mb-2 text-gray-200">
              Constraints
            </h3>
            <div className="bg-[#1a1d27] border border-gray-800 rounded-xl p-4 text-sm text-gray-300 font-mono whitespace-pre-wrap">
              {problem.constraints}
            </div>
          </div>
        )}
      </div>
    )}
    {tab === "submissions" && (
      <div>
        <h3 className="text-sm font-semibold mb-3 text-gray-200">
          My Submissions
        </h3>
        {submissions.length === 0 ? (
          <p className="text-sm text-gray-500 mt-6">No submissions yet.</p>
        ) : (
          <div className="space-y-2">
            {submissions.map((s) => (
              <div
                key={s._id}
                className="bg-[#1a1d27] border border-gray-800 rounded-xl p-4 flex justify-between items-center"
              >
                <div>
                  <p className="text-sm capitalize text-gray-300 font-medium">
                    {s.language}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(s.createdAt).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium ${s.status === "Accepted" ? "text-green-400 bg-green-950" : "text-red-400 bg-red-950"}`}
                >
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    )}
    {tab === "hints" && (
      <div className="space-y-3">
        <p className="text-sm text-gray-400">
          💡 Think about edge cases with negative numbers.
        </p>
        <p className="text-sm text-gray-400">
          💡 Consider time complexity before writing code.
        </p>
        <p className="text-sm text-gray-400">
          💡 Try to solve it with O(n) time if possible.
        </p>
      </div>
    )}
  </div>
);

// ── Output panel (shared) ─────────────────────────────────────────────
const OutputPanel = ({
  results,
  verdict,
  activeResult,
  setActiveResult,
  passedCount,
}) => (
  <div
    className="flex-shrink-0 border-t border-gray-800 bg-[#0d0f18] flex flex-col"
    style={{ maxHeight: "38%", minHeight: 120 }}
  >
    <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-gray-800">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-semibold text-gray-200">
          Test Results
        </span>
        {results.length > 0 && (
          <span
            className={`text-xs px-2.5 py-0.5 rounded-lg font-medium ${passedCount === results.length ? "text-green-400 bg-green-950" : "text-red-400 bg-red-950"}`}
          >
            {passedCount} / {results.length} passed
          </span>
        )}
      </div>
      {verdict && (
        <span
          className={`text-xs font-semibold ${verdict.status === "Accepted" ? "text-green-400" : "text-red-400"}`}
        >
          {verdict.message}
        </span>
      )}
    </div>
    {results.length > 0 && (
      <div className="flex-shrink-0 flex gap-1 px-3 pt-2 pb-1 overflow-x-auto">
        {results.map((r, i) => (
          <button
            key={i}
            onClick={() => setActiveResult(i)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeResult === i
                ? "bg-gray-700 text-white"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${r.passed ? "bg-green-400" : "bg-red-400"}`}
            />
            Case {i + 1}
          </button>
        ))}
      </div>
    )}
    {results[activeResult] && (
      <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-3 text-xs font-mono">
        <div>
          <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">
            Input
          </p>
          <div className="bg-[#1a1d27] border border-gray-800 px-3 py-2 rounded-lg text-gray-300">
            {results[activeResult].input}
          </div>
        </div>
        <div>
          <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">
            Expected
          </p>
          <div className="bg-[#1a1d27] border border-gray-800 px-3 py-2 rounded-lg text-gray-300">
            {results[activeResult].expected}
          </div>
        </div>
        <div>
          <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">
            Your Output
          </p>
          <div
            className={`px-3 py-2 rounded-lg border ${results[activeResult].passed ? "bg-green-950 border-green-800 text-green-300" : "bg-red-950 border-red-900 text-red-300"}`}
          >
            {results[activeResult].actual || (
              <span className="text-gray-500 italic">(empty)</span>
            )}
          </div>
        </div>
        {results[activeResult].stderr && (
          <div>
            <p className="text-yellow-500 text-[10px] uppercase tracking-widest mb-1">
              Stderr
            </p>
            <div className="bg-yellow-950 border border-yellow-900 px-3 py-2 rounded-lg text-yellow-300 whitespace-pre-wrap">
              {results[activeResult].stderr}
            </div>
          </div>
        )}
        {results[activeResult].error && (
          <div>
            <p className="text-red-400 text-[10px] uppercase tracking-widest mb-1">
              Error
            </p>
            <div className="bg-red-950 border border-red-900 px-3 py-2 rounded-lg text-red-300">
              {results[activeResult].error}
            </div>
          </div>
        )}
      </div>
    )}
  </div>
);

// ── ProblemPage ───────────────────────────────────────────────────────
const ProblemPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const contestId = new URLSearchParams(location.search).get("contestId");
  const { user } = useAuth();

  const [problem, setProblem] = useState(null);
  const [tab, setTab] = useState("description");
  const [mobileView, setMobileView] = useState("description"); // 'description' | 'editor'
  const [language, setLanguage] = useState(() => loadLang(id) || "javascript");
  const [code, setCode] = useState(
    () => loadCode(id, loadLang(id) || "javascript") || STARTER.javascript,
  );
  const [results, setResults] = useState([]);
  const [activeResult, setActiveResult] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verdict, setVerdict] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [aiOpen, setAiOpen] = useState(false);

  useEffect(() => {
    fetchProblem();
    fetchSubmissions();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    saveLang(id, language);
    const saved = loadCode(id, language);
    if (saved !== null) {
      setCode(saved);
    } else {
      setCode(
        problem?.starterCode && language === "javascript"
          ? problem.starterCode
          : STARTER[language],
      );
    }
    setResults([]);
    setVerdict(null);
  }, [language]);

  useEffect(() => {
    if (!problem) return;
    const saved = loadCode(id, language);
    if (saved === null && problem.starterCode && language === "javascript")
      setCode(problem.starterCode);
  }, [problem]);

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    saveCode(id, language, newCode);
  };

  const fetchProblem = async () => {
    try {
      const { data } = await API.get(`/problems/${id}`);
      setProblem(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSubmissions = async () => {
    try {
      if (!user) return;
      const { data } = await API.get(`/submissions/user/${user._id}`);
      setSubmissions(
        data.filter((s) => s.problem?._id === id || s.problem === id),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleRun = async () => {
    if (!problem?.sampleTestCases?.length) return;
    setIsRunning(true);
    setResults([]);
    setVerdict(null);
    try {
      const out = await runTestCases(language, code, problem.sampleTestCases);
      setResults(out);
      setActiveResult(0);
      // On mobile, switch to editor view to show results
      setMobileView("editor");
    } catch (err) {
      setVerdict({ status: "error", message: err.message });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setVerdict(null);
    try {
      const { status, results: judgeResults } = await judgeViaBackend(
        language,
        code,
        problem._id,
      );
      await API.post("/submissions", {
        problem: problem._id,
        language,
        code,
        status,
      });
      if (contestId)
        await API.post("/contest-submissions", {
          contest: contestId,
          problem: problem._id,
          status,
        });
      setVerdict({
        status,
        message:
          status === "Accepted"
            ? "✅ All test cases passed!"
            : "❌ Some test cases failed.",
      });
      setResults(judgeResults);
      setActiveResult(0);
      setMobileView("editor");
      fetchSubmissions();
    } catch (err) {
      setVerdict({ status: "error", message: "Submission failed. Try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!problem)
    return (
      <div className="h-screen w-full bg-[#0f1117] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );

  const passedCount = results.filter((r) => r.passed).length;

  // Shared toolbar buttons
  const ToolbarButtons = () => (
    <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
      <button
        onClick={() => setAiOpen((o) => !o)}
        className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors border ${
          aiOpen
            ? "bg-green-700 border-green-600 text-white"
            : "bg-[#1a1d27] border-gray-700 text-gray-300 hover:border-green-700 hover:text-green-400"
        }`}
      >
        <span className="text-sm leading-none">✦</span>
        <span className="hidden sm:inline">Ask AI</span>
      </button>
      <button
        onClick={handleRun}
        disabled={isRunning || isSubmitting || !problem.sampleTestCases?.length}
        className="flex items-center gap-1.5 bg-[#1a1d27] hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed border border-gray-700 px-2.5 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm text-gray-300 font-medium transition-colors"
      >
        {isRunning ? (
    <>
      <span className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
      <span className="hidden sm:inline">Running...</span>
    </>
  ) : (
    <>
      <span>▶</span>
      <span className="hidden sm:inline">Run</span>
    </>
  )}
      </button>
      <button
        onClick={handleSubmit}
        disabled={isRunning || isSubmitting}
        className="flex items-center gap-1.5 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed px-2.5 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors"
      >
        {isSubmitting ? (
          <>
            <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
            <span className="hidden sm:inline">Submitting...</span>
          </>
        ) : (
          "Submit"
        )}
      </button>
    </div>
  );

  return (
    <div className="h-screen w-full bg-[#0f1117] text-white flex flex-col overflow-hidden">
      <div className="flex-shrink-0">
        <Navbar />
      </div>

      {/* ── MOBILE LAYOUT (< md) ── */}
      <div className="md:hidden flex flex-col flex-1 overflow-hidden min-h-0">
        {/* Mobile top bar — view toggle + language + actions */}
        <div className="flex-shrink-0 bg-[#0d0f18] border-b border-gray-800 px-3 py-2 flex items-center justify-between gap-2">
          {/* View toggle */}
          <div className="flex bg-gray-800 rounded-lg p-0.5 flex-shrink-0">
            <button
              onClick={() => setMobileView("description")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${mobileView === "description" ? "bg-gray-600 text-white" : "text-gray-400"}`}
            >
              Problem
            </button>
            <button
              onClick={() => setMobileView("editor")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${mobileView === "editor" ? "bg-gray-600 text-white" : "text-gray-400"}`}
            >
              Editor
            </button>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {mobileView === "editor" && (
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-[#1a1d27] border border-gray-700 text-xs px-2 py-1.5 rounded-lg outline-none text-gray-300 cursor-pointer"
              >
                {Object.entries(LANG_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            )}
            <ToolbarButtons />
          </div>
        </div>

        {/* Mobile description view */}
        {mobileView === "description" && (
          <div className="flex flex-col flex-1 overflow-hidden min-h-0">
            <div className="flex-shrink-0 flex gap-1 px-4 pt-3 border-b border-gray-800">
              {["description", "submissions", "hints"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-2 text-xs sm:text-sm capitalize border-b-2 transition-colors font-medium ${
                    tab === t
                      ? "text-white border-green-400"
                      : "text-gray-400 border-transparent hover:text-gray-200"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <DescriptionContent
              problem={problem}
              tab={tab}
              setTab={setTab}
              submissions={submissions}
            />
            {/* CTA to switch to editor */}
            <div className="flex-shrink-0 p-3 border-t border-gray-800">
              <button
                onClick={() => setMobileView("editor")}
                className="w-full py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Open Editor →
              </button>
            </div>
          </div>
        )}

        {/* Mobile editor view */}
        {mobileView === "editor" && (
          <div className="flex flex-col flex-1 overflow-hidden min-h-0 relative">
            <div className="flex-1 overflow-hidden min-h-0">
              <CodeEditor
                language={language}
                code={code}
                onChange={handleCodeChange}
              />
            </div>
            {(results.length > 0 || verdict) && (
              <OutputPanel
                results={results}
                verdict={verdict}
                activeResult={activeResult}
                setActiveResult={setActiveResult}
                passedCount={passedCount}
              />
            )}
            <AIAssistant
              problem={problem}
              code={code}
              language={language}
              open={aiOpen}
              onClose={() => setAiOpen(false)}
            />
          </div>
        )}
      </div>

      {/* ── DESKTOP LAYOUT (≥ md) ── */}
      <div className="hidden md:flex flex-1 overflow-hidden min-h-0">
        {/* Left panel */}
        <div className="w-[45%] min-w-0 flex flex-col border-r border-gray-800 overflow-hidden">
          <div className="flex-shrink-0 flex gap-1 px-4 pt-3 border-b border-gray-800">
            {["description", "submissions", "hints"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm capitalize border-b-2 transition-colors font-medium ${
                  tab === t
                    ? "text-white border-green-400"
                    : "text-gray-400 border-transparent hover:text-gray-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <DescriptionContent
            problem={problem}
            tab={tab}
            setTab={setTab}
            submissions={submissions}
          />
        </div>

        {/* Right panel */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden relative">
          <div className="flex-shrink-0 h-12 bg-[#0d0f18] border-b border-gray-800 flex items-center justify-between px-4">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-[#1a1d27] border border-gray-700 text-sm px-3 py-1.5 rounded-lg outline-none text-gray-300 cursor-pointer hover:border-gray-600 transition-colors"
            >
              {Object.entries(LANG_LABELS).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
            <ToolbarButtons />
          </div>

          <div className="flex-1 overflow-hidden min-h-0">
            <CodeEditor
              language={language}
              code={code}
              onChange={handleCodeChange}
            />
          </div>

          {(results.length > 0 || verdict) && (
            <OutputPanel
              results={results}
              verdict={verdict}
              activeResult={activeResult}
              setActiveResult={setActiveResult}
              passedCount={passedCount}
            />
          )}

          <AIAssistant
            problem={problem}
            code={code}
            language={language}
            open={aiOpen}
            onClose={() => setAiOpen(false)}
          />
        </div>
      </div>
    </div>
  );
};

export default ProblemPage;
