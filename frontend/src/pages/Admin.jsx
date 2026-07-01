import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";

const EMPTY_PROBLEM = {
  title: "",
  difficulty: "Easy",
  description: "",
  inputExample: "",
  outputExample: "",
  constraints: "",
  tags: "",
  starterCode: "",
  sampleTestCases: "",
  hiddenTestCases: "",
};
const EMPTY_CONTEST = {
  title: "",
  description: "",
  startTime: "",
  endTime: "",
  problemIds: "",
};

const TC_PLACEHOLDER = `[
  { "input": "2 3", "expectedOutput": "5" },
  { "input": "10 20", "expectedOutput": "30" }
]`;

const inputCls =
  "w-full bg-[#0f1117] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors";

const Field = ({ label, hint, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-300 mb-2">
      {label}
    </label>
    {hint && <p className="text-xs text-gray-500 mb-2">{hint}</p>}
    {children}
  </div>
);

const diffStyle = {
  Easy: "text-green-400 bg-green-950",
  Medium: "text-yellow-400 bg-yellow-950",
  Hard: "text-red-400 bg-red-950",
};

const Admin = () => {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState("problem");
  const [problem, setProblem] = useState(EMPTY_PROBLEM);
  const [contest, setContest] = useState(EMPTY_CONTEST);
  const [problemLoading, setProblemLoading] = useState(false);
  const [contestLoading, setContestLoading] = useState(false);

  // Edit tab state
  const [allProblems, setAllProblems] = useState([]);
  const [editTarget, setEditTarget] = useState(null); // problem being edited
  const [editForm, setEditForm] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);

  useEffect(() => {
    if (tab === "edit") fetchAllProblems();
  }, [tab]);

  const fetchAllProblems = async () => {
    setListLoading(true);
    try {
      const { data } = await API.get("/problems");
      setAllProblems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setListLoading(false);
    }
  };

  if (!isAdmin)
    return (
      <div className="min-h-screen w-full bg-[#0f1117] text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Access denied. Admin only.
        </div>
      </div>
    );

  const parseTC = (raw, label) => {
    if (!raw.trim()) return [];
    try {
      const p = JSON.parse(raw);
      if (!Array.isArray(p)) throw new Error("Must be array");
      return p;
    } catch (e) {
      throw new Error(`Bad JSON in ${label}: ${e.message}`);
    }
  };

  // ── Create problem ──────────────────────────────────────────────
  const submitProblem = async (e) => {
    e.preventDefault();
    setProblemLoading(true);
    try {
      const sampleTestCases = parseTC(
        problem.sampleTestCases,
        "Sample Test Cases",
      );
      const hiddenTestCases = parseTC(
        problem.hiddenTestCases,
        "Hidden Test Cases",
      );
      await API.post("/problems", {
        ...problem,
        tags: problem.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        sampleTestCases,
        hiddenTestCases,
      });
      alert("Problem created!");
      setProblem(EMPTY_PROBLEM);
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setProblemLoading(false);
    }
  };

  // ── Create contest ──────────────────────────────────────────────
  const submitContest = async (e) => {
    e.preventDefault();
    setContestLoading(true);
    try {
      const problems = contest.problemIds
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
      await API.post("/contests", { ...contest, problems });
      alert("Contest created!");
      setContest(EMPTY_CONTEST);
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setContestLoading(false);
    }
  };

  // ── Open edit form ──────────────────────────────────────────────
  const openEdit = (p) => {
    setEditTarget(p);
    setEditForm({
      title: p.title,
      difficulty: p.difficulty,
      description: p.description,
      inputExample: p.inputExample || "",
      outputExample: p.outputExample || "",
      constraints: p.constraints || "",
      tags: p.tags?.join(", ") || "",
      starterCode: p.starterCode || "",
      sampleTestCases: JSON.stringify(p.sampleTestCases || [], null, 2),
      hiddenTestCases: JSON.stringify(p.hiddenTestCases || [], null, 2),
    });
  };

  // ── Save edit ───────────────────────────────────────────────────
  const saveEdit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      const sampleTestCases = parseTC(
        editForm.sampleTestCases,
        "Sample Test Cases",
      );
      const hiddenTestCases = parseTC(
        editForm.hiddenTestCases,
        "Hidden Test Cases",
      );
      await API.put(`/problems/${editTarget._id}`, {
        ...editForm,
        tags: editForm.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        sampleTestCases,
        hiddenTestCases,
      });
      alert("Problem updated!");
      setEditTarget(null);
      setEditForm(null);
      fetchAllProblems();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setEditLoading(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────
  const deleteProblem = async (p) => {
    if (!window.confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    try {
      await API.delete(`/problems/${p._id}`);
      setAllProblems((prev) => prev.filter((x) => x._id !== p._id));
      if (editTarget?._id === p._id) {
        setEditTarget(null);
        setEditForm(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const TABS = ["problem", "edit", "contest"];

  return (
    <div className="min-h-screen w-full bg-[#0f1117] text-white">
      <Navbar />

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">
            Create and manage problems and contests
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-800 mb-7">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-sm border-b-2 transition-colors font-medium capitalize ${
                tab === t
                  ? "text-white border-green-400"
                  : "text-gray-400 border-transparent hover:text-gray-200"
              }`}
            >
              {t === "edit" ? "Edit Problems" : `Add ${t}`}
            </button>
          ))}
        </div>

        {/* ── Add Problem ── */}
        {tab === "problem" && (
          <form onSubmit={submitProblem} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Title">
                <input
                  className={inputCls}
                  value={problem.title}
                  onChange={(e) =>
                    setProblem({ ...problem, title: e.target.value })
                  }
                  required
                  placeholder="Two Sum"
                />
              </Field>
              <Field label="Difficulty">
                <select
                  className={inputCls}
                  value={problem.difficulty}
                  onChange={(e) =>
                    setProblem({ ...problem, difficulty: e.target.value })
                  }
                >
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </Field>
            </div>
            <Field label="Description">
              <textarea
                className={inputCls}
                rows="4"
                required
                value={problem.description}
                onChange={(e) =>
                  setProblem({ ...problem, description: e.target.value })
                }
                placeholder="Describe the problem clearly..."
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Input Example">
                <input
                  className={inputCls}
                  value={problem.inputExample}
                  onChange={(e) =>
                    setProblem({ ...problem, inputExample: e.target.value })
                  }
                  placeholder="2 3"
                />
              </Field>
              <Field label="Output Example">
                <input
                  className={inputCls}
                  value={problem.outputExample}
                  onChange={(e) =>
                    setProblem({ ...problem, outputExample: e.target.value })
                  }
                  placeholder="5"
                />
              </Field>
            </div>
            <Field label="Constraints">
              <textarea
                className={inputCls}
                rows="2"
                value={problem.constraints}
                onChange={(e) =>
                  setProblem({ ...problem, constraints: e.target.value })
                }
                placeholder="1 ≤ a, b ≤ 10⁹"
              />
            </Field>
            <Field label="Tags" hint="Comma-separated">
              <input
                className={inputCls}
                value={problem.tags}
                onChange={(e) =>
                  setProblem({ ...problem, tags: e.target.value })
                }
                placeholder="Math, Array, HashMap"
              />
            </Field>
            <Field label="Starter Code (JavaScript)">
              <textarea
                className={`${inputCls} font-mono`}
                rows="5"
                value={problem.starterCode}
                onChange={(e) =>
                  setProblem({ ...problem, starterCode: e.target.value })
                }
                placeholder={"function solve(a, b) {\n  \n}"}
              />
            </Field>
            <Field
              label="Sample Test Cases"
              hint="Shown to user. JSON array — input is space-separated args to solve()"
            >
              <textarea
                className={`${inputCls} font-mono`}
                rows="5"
                value={problem.sampleTestCases}
                onChange={(e) =>
                  setProblem({ ...problem, sampleTestCases: e.target.value })
                }
                placeholder={TC_PLACEHOLDER}
              />
            </Field>
            <Field
              label="Hidden Test Cases"
              hint="Used for judging on Submit. Not shown to user."
            >
              <textarea
                className={`${inputCls} font-mono`}
                rows="5"
                value={problem.hiddenTestCases}
                onChange={(e) =>
                  setProblem({ ...problem, hiddenTestCases: e.target.value })
                }
                placeholder={TC_PLACEHOLDER}
              />
            </Field>
            <button
              type="submit"
              disabled={problemLoading}
              className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {problemLoading ? "Creating..." : "Create Problem"}
            </button>
          </form>
        )}

        {/* ── Edit Problems ── */}
        {tab === "edit" && (
          <div>
            {/* Edit form */}
            {editTarget && editForm ? (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <button
                    onClick={() => {
                      setEditTarget(null);
                      setEditForm(null);
                    }}
                    className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1"
                  >
                    ← Back
                  </button>
                  <h2 className="text-sm font-medium text-gray-300">
                    Editing:{" "}
                    <span className="text-white">{editTarget.title}</span>
                  </h2>
                </div>

                <form onSubmit={saveEdit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Title">
                      <input
                        className={inputCls}
                        value={editForm.title}
                        onChange={(e) =>
                          setEditForm({ ...editForm, title: e.target.value })
                        }
                        required
                      />
                    </Field>
                    <Field label="Difficulty">
                      <select
                        className={inputCls}
                        value={editForm.difficulty}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            difficulty: e.target.value,
                          })
                        }
                      >
                        <option>Easy</option>
                        <option>Medium</option>
                        <option>Hard</option>
                      </select>
                    </Field>
                  </div>
                  <Field label="Description">
                    <textarea
                      className={inputCls}
                      rows="4"
                      required
                      value={editForm.description}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          description: e.target.value,
                        })
                      }
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Input Example">
                      <input
                        className={inputCls}
                        value={editForm.inputExample}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            inputExample: e.target.value,
                          })
                        }
                      />
                    </Field>
                    <Field label="Output Example">
                      <input
                        className={inputCls}
                        value={editForm.outputExample}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            outputExample: e.target.value,
                          })
                        }
                      />
                    </Field>
                  </div>
                  <Field label="Constraints">
                    <textarea
                      className={inputCls}
                      rows="2"
                      value={editForm.constraints}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          constraints: e.target.value,
                        })
                      }
                    />
                  </Field>
                  <Field label="Tags" hint="Comma-separated">
                    <input
                      className={inputCls}
                      value={editForm.tags}
                      onChange={(e) =>
                        setEditForm({ ...editForm, tags: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Starter Code (JavaScript)">
                    <textarea
                      className={`${inputCls} font-mono`}
                      rows="5"
                      value={editForm.starterCode}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          starterCode: e.target.value,
                        })
                      }
                    />
                  </Field>
                  <Field label="Sample Test Cases">
                    <textarea
                      className={`${inputCls} font-mono`}
                      rows="6"
                      value={editForm.sampleTestCases}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          sampleTestCases: e.target.value,
                        })
                      }
                    />
                  </Field>
                  <Field label="Hidden Test Cases">
                    <textarea
                      className={`${inputCls} font-mono`}
                      rows="6"
                      value={editForm.hiddenTestCases}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          hiddenTestCases: e.target.value,
                        })
                      }
                    />
                  </Field>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={editLoading}
                      className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
                    >
                      {editLoading ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteProblem(editTarget)}
                      className="px-6 bg-red-900 hover:bg-red-800 text-red-300 font-semibold py-3 rounded-xl transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* Problem list */
              <div>
                <p className="text-gray-400 text-sm mb-4">
                  Click a problem to edit or delete it.
                </p>
                {listLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : allProblems.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-12">
                    No problems yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {allProblems.map((p) => (
                      <div
                        key={p._id}
                        className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#1a1d27] border border-gray-800 hover:border-gray-700 transition-all"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-lg font-medium flex-shrink-0 ${diffStyle[p.difficulty]}`}
                          >
                            {p.difficulty}
                          </span>
                          <span className="text-sm font-medium text-white truncate">
                            {p.title}
                          </span>
                        </div>
                        <div className="flex gap-2 ml-3 flex-shrink-0">
                          <button
                            onClick={() => openEdit(p)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteProblem(p)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-red-950 hover:bg-red-900 text-red-400 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Add Contest ── */}
        {tab === "contest" && (
          <form onSubmit={submitContest} className="space-y-6">
            <Field label="Contest Title">
              <input
                className={inputCls}
                value={contest.title}
                onChange={(e) =>
                  setContest({ ...contest, title: e.target.value })
                }
                required
                placeholder="Weekly Contest 42"
              />
            </Field>
            <Field label="Description">
              <textarea
                className={inputCls}
                rows="3"
                value={contest.description}
                onChange={(e) =>
                  setContest({ ...contest, description: e.target.value })
                }
                placeholder="4 problems, 90 minutes."
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Start Time">
                <input
                  type="datetime-local"
                  className={inputCls}
                  value={contest.startTime}
                  onChange={(e) =>
                    setContest({ ...contest, startTime: e.target.value })
                  }
                  required
                />
              </Field>
              <Field label="End Time">
                <input
                  type="datetime-local"
                  className={inputCls}
                  value={contest.endTime}
                  onChange={(e) =>
                    setContest({ ...contest, endTime: e.target.value })
                  }
                  required
                />
              </Field>
            </div>
            <Field label="Problem IDs" hint="Comma-separated MongoDB ObjectIDs">
              <textarea
                className={`${inputCls} font-mono`}
                rows="3"
                value={contest.problemIds}
                onChange={(e) =>
                  setContest({ ...contest, problemIds: e.target.value })
                }
                placeholder="683abc..., 683def..."
              />
            </Field>
            <button
              type="submit"
              disabled={contestLoading}
              className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {contestLoading ? "Creating..." : "Create Contest"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Admin;