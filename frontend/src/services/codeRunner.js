import API from './api'

// ─────────────────────────────────────────────
// FRONTEND (JavaScript only) — runs in browser
// ─────────────────────────────────────────────

function runJavaScriptInBrowser(userCode, inputStr) {
  const tokens = inputStr.trim().split(/\s+/)
  const args = tokens.map(t => isNaN(Number(t)) ? t : Number(t))

  // Capture console.log output
  const logs = []
  const fakeConsole = { log: (...a) => logs.push(a.map(String).join(' ')) }

  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function('console', `${userCode}\nreturn solve;`)(fakeConsole)
    const result = fn(...args)
    if (logs.length > 0) return { stdout: logs.join('\n'), stderr: '' }
    if (result !== undefined) return { stdout: String(result), stderr: '' }
    return { stdout: '', stderr: '' }
  } catch (err) {
    return { stdout: '', stderr: err.message }
  }
}

// ─────────────────────────────────────────────
// BACKEND — for Python / Java / C++
// ─────────────────────────────────────────────

function buildRunnable(language, userCode, inputStr) {
  const tokens = inputStr.trim().split(/\s+/)

  switch (language) {
    case 'python': {
      const args = tokens.map(t => isNaN(Number(t)) ? `"${t}"` : t).join(', ')
      return `${userCode}\n\nif __name__=="__main__":\n    r=solve(${args})\n    if r is not None: print(r)`
    }
    case 'java': {
      const args = tokens.map(t => isNaN(Number(t)) ? `"${t}"` : t).join(', ')
      return `${userCode}\npublic class Main{public static void main(String[] a){Solution s=new Solution();Object r=s.solve(${args});if(r!=null)System.out.println(r);}}`
    }
    case 'cpp': {
      const args = tokens.map(t => isNaN(Number(t)) ? `"${t}"` : t).join(', ')
      return `#include<bits/stdc++.h>\nusing namespace std;\n${userCode}\nint main(){auto r=solve(${args});cout<<r<<endl;return 0;}`
    }
    default:
      return userCode
  }
}

async function runViaBackend(language, userCode, inputStr) {
  const code = buildRunnable(language, userCode, inputStr)
  const { data } = await API.post('/execute', { language, code })
  return {
    stdout: (data.stdout || '').trim(),
    stderr: (data.stderr || '').trim(),
  }
}

// ─────────────────────────────────────────────
// Unified executor — picks browser vs backend
// ─────────────────────────────────────────────

async function executeOne(language, userCode, inputStr) {
  if (language === 'javascript') {
    return runJavaScriptInBrowser(userCode, inputStr)
  }
  return runViaBackend(language, userCode, inputStr)
}

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

// Run → sample test cases, always uses executeOne (browser for JS)
export async function runTestCases(language, userCode, testCases) {
  const results = []
  for (const tc of testCases) {
    try {
      const { stdout, stderr } = await executeOne(language, userCode, tc.input)
      const actual = stdout.trim()
      const expected = (tc.expectedOutput || '').trim()
      results.push({ input: tc.input, expected, actual, passed: actual === expected, stderr, error: null })
    } catch (err) {
      const msg = err.response?.data?.error || err.message
      results.push({ input: tc.input, expected: tc.expectedOutput || '', actual: '', passed: false, stderr: '', error: msg })
    }
  }
  return results
}

// Submit → hidden test cases, always goes to backend (so hidden cases stay hidden)
export async function judgeViaBackend(language, userCode, problemId) {
  const { data } = await API.post('/execute/judge', { language, code: userCode, problemId })
  return {
    status: data.status,
    results: data.results || [],
  }
}
