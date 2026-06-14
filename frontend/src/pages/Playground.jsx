import { useState, useEffect, useRef } from 'react'
import Navbar from '../components/Navbar'
import CodeEditor from '../components/CodeEditor'
import API from '../services/api'
import { useAuth } from '../context/AuthContext'

// ── Language config ──────────────────────────────────────────────
const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python',     label: 'Python'     },
  { value: 'java',       label: 'Java'       },
  { value: 'cpp',        label: 'C++'        },
]

const STARTERS = {
  javascript: `// JavaScript Playground
console.log("Hello, World!");

// Write your code here
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet("CodeJudge"));`,

  python: `# Python Playground
print("Hello, World!")

# Write your code here
def greet(name):
    return f"Hello, {name}!"

print(greet("CodeJudge"))`,

  java: `// Java Playground
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        System.out.println(greet("CodeJudge"));
    }

    static String greet(String name) {
        return "Hello, " + name + "!";
    }
}`,

  cpp: `// C++ Playground
#include <bits/stdc++.h>
using namespace std;

string greet(string name) {
    return "Hello, " + name + "!";
}

int main() {
    cout << "Hello, World!" << endl;
    cout << greet("CodeJudge") << endl;
    return 0;
}`,
}

// ── Run code (JS in browser, others via backend) ─────────────────
function runJSInBrowser(code) {
  const logs = []
  const fakeConsole = {
    log:   (...a) => logs.push(a.map(String).join(' ')),
    error: (...a) => logs.push('Error: ' + a.map(String).join(' ')),
    warn:  (...a) => logs.push('Warn: '  + a.map(String).join(' ')),
  }
  try {
    // eslint-disable-next-line no-new-func
    new Function('console', code)(fakeConsole)
    return { stdout: logs.join('\n'), stderr: '' }
  } catch (err) {
    return { stdout: logs.join('\n'), stderr: err.message }
  }
}

async function runCode(language, code) {
  if (language === 'javascript') return runJSInBrowser(code)
  const { data } = await API.post('/execute', { language, code })
  return { stdout: data.stdout || '', stderr: data.stderr || '' }
}

// ── Snippet history panel ────────────────────────────────────────
const HistoryPanel = ({ snippets, onLoad, onDelete, loading }) => {
  const LANG_COLORS = {
    javascript: 'text-yellow-400 bg-yellow-950',
    python:     'text-blue-400   bg-blue-950',
    java:       'text-orange-400 bg-orange-950',
    cpp:        'text-purple-400 bg-purple-950',
  }

  if (loading) return (
    <div className="flex items-center justify-center h-32">
      <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (snippets.length === 0) return (
    <div className="text-center py-10">
      <p className="text-gray-500 text-sm">No saved snippets yet.</p>
      <p className="text-gray-600 text-xs mt-1">Save your code with the button above.</p>
    </div>
  )

  return (
    <div className="space-y-2">
      {snippets.map(s => (
        <div key={s._id}
          className="group flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#0f1117] border border-gray-800 hover:border-gray-700 transition-all"
        >
          <button
            onClick={() => onLoad(s._id)}
            className="flex-1 text-left min-w-0"
          >
            <p className="text-sm font-medium text-white truncate">{s.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${LANG_COLORS[s.language] || 'text-gray-400 bg-gray-800'}`}>
                {s.language}
              </span>
              <span className="text-[10px] text-gray-600">
                {new Date(s.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </button>
          <button
            onClick={() => onDelete(s._id, s.title)}
            className="ml-2 opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all p-1 rounded"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}

// ── Save modal ───────────────────────────────────────────────────
const SaveModal = ({ onSave, onClose, initialTitle, saving }) => {
  const [title, setTitle] = useState(initialTitle || '')
  const inputRef = useRef(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (title.trim()) onSave(title.trim())
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4">
      <div className="bg-[#1a1d27] border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="text-base font-semibold text-white mb-4">Save Snippet</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Snippet name</label>
            <input
              ref={inputRef}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Binary Search Template"
              maxLength={100}
              required
              className="w-full bg-[#0f1117] border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-green-500 transition-colors"
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-700 text-sm text-gray-400 hover:text-white hover:border-gray-500 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving || !title.trim()}
              className="flex-1 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-50 text-sm font-semibold text-white transition-colors">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Playground page ─────────────────────────────────────────
const Playground = () => {
  const { user } = useAuth()

  const [language, setLanguage]     = useState('javascript')
  const [code, setCode]             = useState(STARTERS.javascript)
  const [output, setOutput]         = useState(null)   // { stdout, stderr } | null
  const [isRunning, setIsRunning]   = useState(false)
  const [stdin, setStdin]           = useState('')
  const [showStdin, setShowStdin]   = useState(false)

  // Snippet state
  const [snippets, setSnippets]         = useState([])
  const [snippetsLoading, setSnippetsLoading] = useState(true)
  const [currentSnippetId, setCurrentSnippetId] = useState(null)
  const [currentTitle, setCurrentTitle] = useState('')
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [saving, setSaving]             = useState(false)
  const [sidebarOpen, setSidebarOpen]   = useState(true)
  const [saveSuccess, setSaveSuccess]   = useState(false)

  useEffect(() => { fetchSnippets() }, [])

  // When language changes, if no current snippet loaded, show starter
  const handleLanguageChange = (lang) => {
    setLanguage(lang)
    if (!currentSnippetId) {
      setCode(STARTERS[lang])
    }
    setOutput(null)
  }

  const fetchSnippets = async () => {
    try {
      const { data } = await API.get('/snippets')
      setSnippets(data)
    } catch (err) { console.error(err) }
    finally { setSnippetsLoading(false) }
  }

  const handleRun = async () => {
    setIsRunning(true)
    setOutput(null)
    try {
      // For languages that use stdin, append it as input if provided
      let codeToRun = code
      if (showStdin && stdin.trim() && language !== 'javascript') {
        // For backend execution, we send stdin separately
        const { data } = await API.post('/execute', { language, code, stdin })
        setOutput({ stdout: data.stdout || '', stderr: data.stderr || '' })
        return
      }
      const result = await runCode(language, codeToRun)
      setOutput(result)
    } catch (err) {
      setOutput({ stdout: '', stderr: err.response?.data?.error || err.message })
    } finally {
      setIsRunning(false)
    }
  }

  const handleSave = async (title) => {
    setSaving(true)
    try {
      if (currentSnippetId) {
        // Update existing
        const { data } = await API.put(`/snippets/${currentSnippetId}`, { title, language, code })
        setSnippets(prev => prev.map(s => s._id === currentSnippetId ? { ...s, title: data.title, language: data.language, updatedAt: data.updatedAt } : s))
        setCurrentTitle(data.title)
      } else {
        // Create new
        const { data } = await API.post('/snippets', { title, language, code })
        setSnippets(prev => [{ _id: data._id, title: data.title, language: data.language, updatedAt: data.updatedAt }, ...prev])
        setCurrentSnippetId(data._id)
        setCurrentTitle(data.title)
      }
      setShowSaveModal(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleLoadSnippet = async (id) => {
    try {
      const { data } = await API.get(`/snippets/${id}`)
      setCode(data.code)
      setLanguage(data.language)
      setCurrentSnippetId(data._id)
      setCurrentTitle(data.title)
      setOutput(null)
    } catch (err) {
      alert('Failed to load snippet')
    }
  }

  const handleDeleteSnippet = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return
    try {
      await API.delete(`/snippets/${id}`)
      setSnippets(prev => prev.filter(s => s._id !== id))
      if (currentSnippetId === id) {
        setCurrentSnippetId(null)
        setCurrentTitle('')
      }
    } catch (err) {
      alert('Failed to delete snippet')
    }
  }

  const handleNewSnippet = () => {
    setCurrentSnippetId(null)
    setCurrentTitle('')
    setCode(STARTERS[language])
    setOutput(null)
  }

  const openSaveModal = () => setShowSaveModal(true)

  return (
    <div className="h-screen w-full bg-[#0f1117] text-white flex flex-col overflow-hidden">
      <div className="flex-shrink-0"><Navbar /></div>

      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* ── Sidebar ── */}
        <div className={`flex-shrink-0 border-r border-gray-800 flex flex-col bg-[#0d0f18] transition-all duration-200 ${sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 flex-shrink-0">
            <span className="text-sm font-semibold text-gray-200">Saved Snippets</span>
            <button
              onClick={handleNewSnippet}
              className="text-xs px-2.5 py-1 rounded-lg bg-green-700 hover:bg-green-600 text-white font-medium transition-colors"
            >
              + New
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <HistoryPanel
              snippets={snippets}
              onLoad={handleLoadSnippet}
              onDelete={handleDeleteSnippet}
              loading={snippetsLoading}
            />
          </div>
        </div>

        {/* ── Main area ── */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">

          {/* Toolbar */}
          <div className="flex-shrink-0 h-12 bg-[#0d0f18] border-b border-gray-800 flex items-center justify-between px-4 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Sidebar toggle */}
              <button
                onClick={() => setSidebarOpen(o => !o)}
                className="text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0"
                title="Toggle snippets panel"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Current snippet title or untitled */}
              <span className="text-sm text-gray-400 truncate">
                {currentTitle || <span className="italic text-gray-600 mx-2">Untitled</span>}
              </span>

              {/* Stdin toggle */}
              <button
                onClick={() => setShowStdin(o => !o)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-colors flex-shrink-0 ${
                  showStdin
                    ? 'bg-blue-900 border-blue-700 text-blue-300'
                    : 'bg-transparent border-gray-700 text-gray-500 hover:text-gray-300'
                }`}
              >
                stdin
              </button>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Language selector */}
              <select
                value={language}
                onChange={e => handleLanguageChange(e.target.value)}
                className="bg-[#1a1d27] border border-gray-700 text-sm px-3 py-1.5 rounded-lg outline-none text-gray-300 cursor-pointer hover:border-gray-600 transition-colors"
              >
                {LANGUAGES.map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>

              {/* Save button */}
              <button
                onClick={openSaveModal}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  saveSuccess
                    ? 'bg-green-800 border-green-700 text-green-300'
                    : 'bg-[#1a1d27] border-gray-700 text-gray-300 hover:border-green-600 hover:text-green-400'
                }`}
              >
                {saveSuccess ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Saved
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Save
                  </>
                )}
              </button>

              {/* Run button */}
              <button
                onClick={handleRun}
                disabled={isRunning}
                className="flex items-center gap-1.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors"
              >
                {isRunning ? (
                  <>
                    <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                    Running...
                  </>
                ) : '▶ Run'}
              </button>
            </div>
          </div>

          {/* Editor + optional stdin + output */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">

            {/* Stdin input */}
            {showStdin && (
              <div className="flex-shrink-0 border-b border-gray-800 bg-[#0d0f18]">
                <div className="flex items-center gap-2 px-4 py-1.5 border-b border-gray-800">
                  <span className="text-xs text-gray-500 font-mono">stdin</span>
                  <span className="text-xs text-gray-600">— input to pass to your program</span>
                </div>
                <textarea
                  value={stdin}
                  onChange={e => setStdin(e.target.value)}
                  placeholder="Enter input here..."
                  rows={3}
                  className="w-full bg-transparent px-4 py-2 text-sm font-mono text-gray-300 placeholder-gray-700 outline-none resize-none"
                />
              </div>
            )}

            {/* Monaco editor */}
            <div className={`overflow-hidden min-h-0 ${output ? 'flex-1' : 'flex-1'}`}>
              <CodeEditor language={language} code={code} onChange={setCode} />
            </div>

            {/* Output panel */}
            {output !== null && (
              <div className="flex-shrink-0 border-t border-gray-800 bg-[#0d0f18]" style={{ maxHeight: '65%' }}>
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-200">Output</span>
                    {output.stderr ? (
                      <span className="text-xs px-2 py-0.5 rounded-lg bg-red-950 text-red-400 font-medium">Error</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-lg bg-green-950 text-green-400 font-medium">Success</span>
                    )}
                  </div>
                  <button
                    onClick={() => setOutput(null)}
                    className="text-gray-600 hover:text-gray-400 transition-colors text-lg leading-none"
                  >
                    ✕
                  </button>
                </div>
                <div className="overflow-y-auto font-mono text-sm p-4 space-y-3" style={{ maxHeight: 'calc(35vh - 44px)' }}>
                  {output.stdout && (
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1.5">stdout</p>
                      <pre className="text-gray-200 whitespace-pre-wrap leading-relaxed">{output.stdout}</pre>
                    </div>
                  )}
                  {output.stderr && (
                    <div>
                      <p className="text-[10px] text-red-500 uppercase tracking-widest mb-1.5">stderr / error</p>
                      <pre className="text-red-300 whitespace-pre-wrap leading-relaxed">{output.stderr}</pre>
                    </div>
                  )}
                  {!output.stdout && !output.stderr && (
                    <p className="text-gray-600 italic text-sm">No output produced.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save modal */}
      {showSaveModal && (
        <SaveModal
          onSave={handleSave}
          onClose={() => setShowSaveModal(false)}
          initialTitle={currentTitle}
          saving={saving}
        />
      )}
    </div>
  )
}

export default Playground;