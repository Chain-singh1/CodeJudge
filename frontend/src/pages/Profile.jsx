import { useEffect, useState, useMemo, useRef } from "react";
import Navbar from "../components/Navbar";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";

// ── Heatmap constants ─────────────────────────────────────────────
const CELL = 12;
const GAP = 3;
const STEP = CELL + GAP;
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const LEVEL_COLORS = ["#ffffe9", "#0e4429", "#006d32", "#26a641", "#39d353"];

function localKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function buildDays() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(today.getDate() - 364 - today.getDay());
  const days = [];
  let cursor = new Date(start);
  while (cursor <= today) {
    days.push(new Date(cursor));
    cursor = addDays(cursor, 1);
  }
  return days;
}

function getLevel(count) {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

// ── Activity Heatmap ──────────────────────────────────────────────
const ActivityHeatmap = ({ submissions }) => {
  const containerRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);

  const countByDay = useMemo(() => {
    const map = {};
    submissions.forEach((s) => {
      if (!s.createdAt) return;
      const key = localKey(new Date(s.createdAt));
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [submissions]);

  const days = useMemo(() => buildDays(), []);

  const columns = useMemo(() => {
    const cols = [];
    for (let i = 0; i < days.length; i += 7) cols.push(days.slice(i, i + 7));
    return cols;
  }, [days]);

  const monthLabels = useMemo(() => {
    const labels = [];
    columns.forEach((col, ci) => {
      col.forEach((day) => {
        if (day.getDate() === 1)
          labels.push({ colIndex: ci, name: MONTH_NAMES[day.getMonth()] });
      });
    });
    return labels;
  }, [columns]);

  const { currentStreak, longestStreak, totalActive } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let current = 0,
      longest = 0,
      run = 0,
      totalActive = 0;
    let cur = new Date(today);
    if (!countByDay[localKey(cur)]) cur = addDays(cur, -1);
    while (countByDay[localKey(cur)]) {
      current++;
      cur = addDays(cur, -1);
    }
    const keys = Object.keys(countByDay).sort();
    keys.forEach((key, i) => {
      totalActive++;
      if (i === 0) {
        run = 1;
      } else {
        const diff = (new Date(key) - new Date(keys[i - 1])) / 86400000;
        run = diff === 1 ? run + 1 : 1;
      }
      if (run > longest) longest = run;
    });
    return { currentStreak: current, longestStreak: longest, totalActive };
  }, [countByDay]);

  const todayKey = localKey(new Date());
  const gridWidth = columns.length * STEP - GAP;
  const gridHeight = 7 * STEP - GAP;
  const LEFT_PAD = 28;

  return (
    <div
      className="bg-[#1a1d27] border border-gray-800 rounded-2xl p-4 sm:p-5 mb-6"
      ref={containerRef}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <h2 className="text-sm font-semibold text-white">Activity</h2>
        <div className="flex items-center gap-4 sm:gap-5 text-xs text-center text-gray-400">
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-green-400">
              {currentStreak}
            </span>
            <span>Current streak</span>
          </div>
          <div className="w-px h-8 bg-gray-700" />
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-white">
              {longestStreak}
            </span>
            <span>Longest streak</span>
          </div>
          <div className="w-px h-8 bg-gray-700" />
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-white">{totalActive}</span>
            <span>Active days</span>
          </div>
        </div>
      </div>

      {/* Scrollable grid */}
      <div className="overflow-x-auto pb-1">
        <div
          style={{
            position: "relative",
            width: LEFT_PAD + gridWidth,
            minWidth: LEFT_PAD + gridWidth,
          }}
        >
          {/* Month labels */}
          <div
            style={{
              position: "relative",
              height: 16,
              marginLeft: LEFT_PAD,
              marginBottom: 4,
            }}
          >
            {monthLabels.map((lbl, i) => (
              <span
                key={i}
                style={{
                  position: "absolute",
                  left: lbl.colIndex * STEP,
                  fontSize: 10,
                  color: "#6b7280",
                  whiteSpace: "nowrap",
                  lineHeight: "16px",
                }}
              >
                {lbl.name}
              </span>
            ))}
          </div>

          {/* Day labels + grid */}
          <div style={{ display: "flex" }}>
            <div style={{ width: LEFT_PAD, flexShrink: 0 }}>
              {DAY_LABELS.map((label, i) => (
                <div
                  key={label}
                  style={{
                    height: CELL,
                    marginBottom: i < 6 ? GAP : 0,
                    lineHeight: `${CELL}px`,
                    fontSize: 9,
                    color: "#6b7280",
                    textAlign: "right",
                    paddingRight: 5,
                    visibility: [1, 3, 5].includes(i) ? "visible" : "hidden",
                  }}
                >
                  {label}
                </div>
              ))}
            </div>

            <div
              style={{
                position: "relative",
                width: gridWidth,
                height: gridHeight,
              }}
            >
              {columns.map((col, ci) =>
                col.map((day, di) => {
                  const key = localKey(day);
                  const count = countByDay[key] || 0;
                  const level = getLevel(count);
                  const isToday = key === todayKey;
                  return (
                    <div
                      key={key}
                      style={{
                        position: "absolute",
                        left: ci * STEP,
                        top: di * STEP,
                        width: CELL,
                        height: CELL,
                        borderRadius: 2,
                        backgroundColor: LEVEL_COLORS[level],
                        boxShadow: isToday ? "0 0 0 1.5px #4ade80" : undefined,
                        cursor: "pointer",
                      }}
                      onMouseEnter={() =>
                        setTooltip({ day, count, x: ci * STEP, y: di * STEP })
                      }
                      onMouseLeave={() => setTooltip(null)}
                    />
                  );
                }),
              )}

              {/* Tooltip */}
              {tooltip &&
                (() => {
                  const tipW = 172;
                  const flipLeft = tooltip.x > gridWidth / 2;
                  const left = flipLeft
                    ? tooltip.x - tipW - 4
                    : tooltip.x + CELL + 4;
                  const top = Math.max(0, tooltip.y - 20);
                  return (
                    <div
                      style={{
                        position: "absolute",
                        left,
                        top,
                        width: tipW,
                        pointerEvents: "none",
                        zIndex: 50,
                      }}
                      className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 shadow-xl"
                    >
                      <p className="text-white text-xs font-semibold">
                        {tooltip.count === 0
                          ? "No submissions"
                          : `${tooltip.count} submission${tooltip.count > 1 ? "s" : ""}`}
                      </p>
                      <p className="text-gray-400 text-[10px] mt-0.5">
                        {tooltip.day.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  );
                })()}
            </div>
          </div>

          {/* Legend */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              marginTop: 10,
              justifyContent: "flex-end",
            }}
          >
            <span style={{ fontSize: 10, color: "#6b7280", marginRight: 4 }}>
              Less
            </span>
            {LEVEL_COLORS.map((color, i) => (
              <div
                key={i}
                style={{
                  width: CELL,
                  height: CELL,
                  borderRadius: 2,
                  backgroundColor: color,
                }}
              />
            ))}
            <span style={{ fontSize: 10, color: "#6b7280", marginLeft: 4 }}>
              More
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Difficulty styles ─────────────────────────────────────────────
const diffStyle = {
  Easy: "text-green-400",
  Medium: "text-yellow-400",
  Hard: "text-red-400",
};

const diffBadge = {
  Easy: "text-green-400 bg-green-950",
  Medium: "text-yellow-400 bg-yellow-950",
  Hard: "text-red-400 bg-red-950",
};

// ── Profile page ──────────────────────────────────────────────────
const Profile = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchSubmissions();
  }, [user]);

  const fetchSubmissions = async () => {
    try {
      const { data } = await API.get(`/submissions/user/${user._id}`);
      setSubmissions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const accepted = submissions.filter((s) => s.status === "Accepted");
  const solved = new Set(accepted.map((s) => s.problem?._id)).size;
  const rate = submissions.length
    ? Math.round((accepted.length / submissions.length) * 100)
    : 0;

  const byDiff = accepted.reduce((acc, s) => {
    const d = s.problem?.difficulty;
    if (d) {
      acc[d] = acc[d] || new Set();
      acc[d].add(s.problem._id);
    }
    return acc;
  }, {});

  return (
    <div className="min-h-screen w-full bg-[#0f1117] text-white">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* User card */}
        <div className="bg-[#1a1d27] border border-gray-800 rounded-2xl p-4 sm:p-6 mb-6 flex items-center gap-4 sm:gap-5">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-green-700 flex items-center justify-center text-xl sm:text-2xl font-bold text-white flex-shrink-0">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold truncate">
              {user?.username}
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-0.5 truncate">
              {user?.email}
            </p>
            {user?.role === "admin" && (
              <span className="inline-block mt-1.5 text-xs px-2 py-0.5 rounded-lg bg-purple-900 text-purple-400">
                Admin
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
          {[
            { label: "Solved", value: solved },
            { label: "Submissions", value: submissions.length },
            { label: "Acceptance", value: `${rate}%` },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="bg-[#1a1d27] border border-gray-800 rounded-2xl p-3 sm:p-5 text-center"
            >
              <p className="text-2xl sm:text-3xl font-bold text-white">
                {value}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-400 mt-1">
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Difficulty breakdown */}
        <div className="bg-[#1a1d27] border border-gray-800 rounded-2xl p-4 sm:p-5 mb-6">
          <h2 className="text-sm font-medium text-gray-300 mb-4">
            Solved by Difficulty
          </h2>
          <div className="flex gap-4 sm:gap-8 flex-wrap">
            {[
              ["Easy", "bg-green-500"],
              ["Medium", "bg-yellow-500"],
              ["Hard", "bg-red-500"],
            ].map(([label, dot]) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dot}`}
                />
                <span className={`text-sm ${diffStyle[label]}`}>{label}</span>
                <span className="text-sm font-bold text-white">
                  {byDiff[label]?.size || 0}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Heatmap */}
        <ActivityHeatmap submissions={submissions} />

        {/* Recent submissions */}
        <div className="bg-[#1a1d27] border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-800">
            <h2 className="text-sm font-medium text-gray-300">
              Recent Submissions
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center text-gray-500 py-10 text-sm">
              No submissions yet
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {submissions.slice(0, 20).map((s) => (
                <div
                  key={s._id}
                  className="px-4 sm:px-6 py-3.5 hover:bg-[#1e2130] transition-colors"
                >
                  {/* Mobile layout — stacked */}
                  <div className="sm:hidden flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">
                        {s.problem?.title || "—"}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span
                          className={`text-xs ${diffStyle[s.problem?.difficulty]}`}
                        >
                          {s.problem?.difficulty}
                        </span>
                        <span className="text-xs text-gray-500 capitalize">
                          {s.language}
                        </span>
                        <span className="text-xs text-gray-600">
                          {new Date(s.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-lg font-medium ${
                        s.status === "Accepted"
                          ? "text-green-400 bg-green-950"
                          : "text-red-400 bg-red-950"
                      }`}
                    >
                      {s.status === "Accepted" ? "✓ AC" : "✗ WA"}
                    </span>
                  </div>

                  {/* Desktop layout — single row */}
                  <div className="hidden sm:flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {s.problem?.title || "—"}
                      </p>
                    </div>
                    <span
                      className={`flex-shrink-0 text-xs ${diffStyle[s.problem?.difficulty]}`}
                    >
                      {s.problem?.difficulty}
                    </span>
                    <span className="flex-shrink-0 text-xs text-gray-400 capitalize w-20 text-center">
                      {s.language}
                    </span>
                    <span
                      className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-lg font-medium w-24 text-center ${
                        s.status === "Accepted"
                          ? "text-green-400 bg-green-950"
                          : "text-red-400 bg-red-950"
                      }`}
                    >
                      {s.status}
                    </span>
                    <span className="flex-shrink-0 text-xs text-gray-500 w-20 text-right">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;