const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");
const Problem = require("../models/Problem");

const TIMEOUT_MS = 30000;
const MAX_CODE_LEN = 50000; // 50KB max code
const MAX_OUT_LEN = 100000; // 100KB max output
const IS_WINDOWS = process.platform === "win32";

const CMD = {
  node: "node",
  python: IS_WINDOWS ? "python" : "python3",
  javac: "javac",
  java: "java",
  gpp: "g++",
};

const ALLOWED_LANGUAGES = new Set(["javascript", "python", "java", "cpp"]);

function run(cmd, args = [], opts = {}, stdinData = "") {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      timeout: TIMEOUT_MS,
      ...opts,
    });

    let stdout = "";
    let stderr = "";
    let outputSize = 0;
    let killed = false;

    child.stdout.on("data", (d) => {
      outputSize += d.length;
      if (outputSize > MAX_OUT_LEN) {
        if (!killed) {
          killed = true;
          child.kill("SIGTERM");
          stdout += "\n[Output truncated — exceeded 100KB limit]";
        }
      } else {
        stdout += d.toString();
      }
    });
    child.stderr.on("data", (d) => {
      stderr += d.toString();
    });

    const input = (stdinData || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    if (input.trim()) {
      child.stdin.write(input, "utf8", () => child.stdin.end());
    } else {
      child.stdin.end();
    }

    child.on("close", (code, signal) => {
      resolve({
        stdout,
        stderr:
          signal === "SIGTERM"
            ? killed
              ? "Output limit exceeded"
              : "Time limit exceeded"
            : stderr,
      });
    });

    child.on("error", (err) => {
      resolve({ stdout, stderr: err.message });
    });
  });
}

function buildRunnable(language, userCode, inputStr) {
  const tokens = (inputStr || "").trim().split(/\s+/);

  switch (language) {
    case "javascript": {
      const args = JSON.stringify(
        tokens.map((t) => (isNaN(Number(t)) ? t : Number(t))),
      );
      return `${userCode}\n\n;(function(){const r=solve(...${args});if(r!==undefined)console.log(String(r));})()`;
    }
    case "python": {
      const args = tokens
        .map((t) => (isNaN(Number(t)) ? `"${t}"` : t))
        .join(", ");
      return `${userCode}\n\nif __name__=="__main__":\n    r=solve(${args})\n    if r is not None: print(r)`;
    }
    case "java": {
      const args = tokens
        .map((t) => (isNaN(Number(t)) ? `"${t}"` : t))
        .join(", ");
      return `${userCode}\npublic class Main{public static void main(String[] a){Solution s=new Solution();Object r=s.solve(${args});if(r!=null)System.out.println(r);}}`;
    }
    case "cpp": {
      const args = tokens
        .map((t) => (isNaN(Number(t)) ? `"${t}"` : t))
        .join(", ");
      return `#include<bits/stdc++.h>\nusing namespace std;\n${userCode}\nint main(){auto r=solve(${args});cout<<r<<endl;return 0;}`;
    }
    default:
      return userCode;
  }
}

async function runOneCase(language, userCode, inputStr, tmpDir) {
  const code = buildRunnable(language, userCode, inputStr);

  if (language === "javascript") {
    const file = path.join(tmpDir, `sol_${Date.now()}.js`);
    fs.writeFileSync(file, code);
    // --max-old-space-size limits Node memory to 128MB
    return run(CMD.node, ["--max-old-space-size=128", file]);
  }
  if (language === "python") {
    const file = path.join(tmpDir, `sol_${Date.now()}.py`);
    fs.writeFileSync(file, code);
    return run(CMD.python, [file]);
  }
  if (language === "java") {
    const file = path.join(tmpDir, "Main.java");
    fs.writeFileSync(file, code);
    const compile = await run(CMD.javac, ["-encoding", "UTF-8", file], {
      cwd: tmpDir,
    });
    if (compile.stderr) return { stdout: "", stderr: compile.stderr };
    // -Xmx128m limits Java heap to 128MB
    return run(CMD.java, [
      "-Xmx128m",
      "-Dfile.encoding=UTF-8",
      "-cp",
      tmpDir,
      "Main",
    ]);
  }
  if (language === "cpp") {
    const srcFile = path.join(tmpDir, `sol_${Date.now()}.cpp`);
    const outFile = path.join(
      tmpDir,
      IS_WINDOWS ? `sol_${Date.now()}.exe` : `sol_${Date.now()}`,
    );
    fs.writeFileSync(srcFile, code);
    const compile = await run(CMD.gpp, ["-o", outFile, srcFile]);
    if (compile.stderr) return { stdout: "", stderr: compile.stderr };
    return run(outFile, []);
  }
  return { stdout: "", stderr: `Unsupported language: ${language}` };
}

const executeCode = async (req, res) => {
  const { language, code, stdin = "" } = req.body;

  if (!language || !code)
    return res.status(400).json({ error: "language and code are required" });

  if (!ALLOWED_LANGUAGES.has(language))
    return res.status(400).json({ error: `Unsupported language: ${language}` });

  if (code.length > MAX_CODE_LEN)
    return res.status(400).json({ error: "Code too large (max 50KB)" });

  if (stdin.length > 10000)
    return res.status(400).json({ error: "stdin too large (max 10KB)" });

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cj-"));

  try {
    let result;

    if (language === "javascript") {
      const file = path.join(tmpDir, "solution.js");
      fs.writeFileSync(file, code);
      result = await run(
        CMD.node,
        ["--max-old-space-size=128", file],
        {},
        stdin,
      );
    } else if (language === "python") {
      const file = path.join(tmpDir, "solution.py");
      fs.writeFileSync(file, code);
      result = await run(CMD.python, [file], {}, stdin);
    } else if (language === "java") {
      const file = path.join(tmpDir, "Main.java");
      fs.writeFileSync(file, code);
      const compile = await run(CMD.javac, ["-encoding", "UTF-8", file], {
        cwd: tmpDir,
      });
      if (compile.stderr)
        return res.json({ stdout: "", stderr: compile.stderr });
      result = await run(
        CMD.java,
        ["-Xmx128m", "-Dfile.encoding=UTF-8", "-cp", tmpDir, "Main"],
        {},
        stdin,
      );
    } else if (language === "cpp") {
      const srcFile = path.join(tmpDir, "solution.cpp");
      const outFile = path.join(
        tmpDir,
        IS_WINDOWS ? "solution.exe" : "solution",
      );
      fs.writeFileSync(srcFile, code);
      const compile = await run(CMD.gpp, ["-o", outFile, srcFile]);
      if (compile.stderr)
        return res.json({ stdout: "", stderr: compile.stderr });
      result = await run(outFile, [], {}, stdin);
    }

    res.json({ stdout: result.stdout, stderr: result.stderr });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
};

const judgeCode = async (req, res) => {
  const { language, code: userCode, problemId } = req.body;

  if (!language || !userCode || !problemId)
    return res
      .status(400)
      .json({ error: "language, code and problemId are required" });

  if (!ALLOWED_LANGUAGES.has(language))
    return res.status(400).json({ error: `Unsupported language: ${language}` });

  if (userCode.length > MAX_CODE_LEN)
    return res.status(400).json({ error: "Code too large (max 50KB)" });

  const problem = await Problem.findById(problemId);
  if (!problem) return res.status(404).json({ error: "Problem not found" });

  const testCases = problem.hiddenTestCases?.length
    ? problem.hiddenTestCases
    : problem.sampleTestCases || [];

  if (!testCases.length) return res.json({ status: "Accepted", results: [] });

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cj-judge-"));
  const results = [];

  try {
    for (const tc of testCases) {
      try {
        const { stdout, stderr } = await runOneCase(
          language,
          userCode,
          tc.input,
          tmpDir,
        );
        const actual = stdout.trim();
        const expected = (tc.expectedOutput || "").trim();
        const passed = actual === expected;
        results.push({
          input: passed ? "(hidden)" : tc.input,
          expected: passed ? "(hidden)" : expected,
          actual,
          passed,
          stderr,
          error: null,
        });
      } catch (err) {
        results.push({
          input: "(hidden)",
          expected: "(hidden)",
          actual: "",
          passed: false,
          stderr: "",
          error: err.message,
        });
      }
    }
    res.json({
      status: results.every((r) => r.passed) ? "Accepted" : "Wrong Answer",
      results,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
};

module.exports = { executeCode, judgeCode };
