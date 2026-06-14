import { useEffect, useState, useMemo, useRef } from 'react'
import Navbar from '../components/Navbar'
import API from '../services/api'
import { useAuth } from '../context/AuthContext'

// ── constants ──────────────────────────────────────────────────────
const CELL   = 13   // cell size px
const GAP    = 3    // gap between cells px
const STEP   = CELL + GAP

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAY_LABELS  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

const diffStyle = { Easy: 'text-green-400', Medium: 'text-yellow-400', Hard: 'text-red-400' }

// ── helpers ────────────────────────────────────────────────────────

// "YYYY-MM-DD" using LOCAL timezone (avoids UTC shift bug)
function localKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

// Build a flat list of dates for the past year starting on a Sunday
function buildDays() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Go back to the Sunday of the week 52 weeks ago
  const start = new Date(today)
  start.setDate(today.getDate() - 364 - today.getDay())

  const days = []
  let cursor = new Date(start)
  while (cursor <= today) {
    days.push(new Date(cursor))
    cursor = addDays(cursor, 1)
  }
  return days
}

function getLevel(count) {
  if (count === 0) return 0
  if (count === 1) return 1
  if (count <= 3)  return 2
  if (count <= 6)  return 3
  return 4
}

// Inline bg colours (avoid Tailwind purging dynamic classes)
const LEVEL_COLORS = [
  '#ffffe9',   // 0 – empty
  '#0e4429',   // 1
  '#006d32',   // 2
  '#26a641',   // 3
  '#39d353',   // 4
]

// ── ActivityHeatmap ────────────────────────────────────────────────
const ActivityHeatmap = ({ submissions }) => {
  const containerRef = useRef(null)
  const [tooltip, setTooltip] = useState(null) // { day, count, cellX, cellY }

  // count per local day
  const countByDay = useMemo(() => {
    const map = {}
    submissions.forEach(s => {
      if (!s.createdAt) return
      const key = localKey(new Date(s.createdAt))
      map[key] = (map[key] || 0) + 1
    })
    return map
  }, [submissions])

  const days = useMemo(() => buildDays(), [])

  // Group into columns (weeks), each column = 7 days Sun→Sat
  const columns = useMemo(() => {
    const cols = []
    for (let i = 0; i < days.length; i += 7) {
      cols.push(days.slice(i, i + 7))
    }
    return cols
  }, [days])

  // Month labels: for each column, check if any day is the 1st of a month
  const monthLabels = useMemo(() => {
    const labels = []
    columns.forEach((col, ci) => {
      col.forEach(day => {
        if (day.getDate() === 1) {
          labels.push({ colIndex: ci, name: MONTH_NAMES[day.getMonth()] })
        }
      })
    })
    return labels
  }, [columns])

  // Streak stats
  const { currentStreak, longestStreak, totalActive } = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0)
    let current = 0, longest = 0, run = 0, totalActive = 0

    // current streak — walk backward from today
    let cur = new Date(today)
    // if today has no submission, streak starts from yesterday
    if (!countByDay[localKey(cur)]) cur = addDays(cur, -1)
    while (countByDay[localKey(cur)]) {
      current++
      cur = addDays(cur, -1)
    }

    // longest streak & active days — scan sorted keys
    const keys = Object.keys(countByDay).sort()
    keys.forEach((key, i) => {
      totalActive++
      if (i === 0) { run = 1 }
      else {
        const diff = (new Date(key) - new Date(keys[i-1])) / 86400000
        run = diff === 1 ? run + 1 : 1
      }
      if (run > longest) longest = run
    })

    return { currentStreak: current, longestStreak: longest, totalActive }
  }, [countByDay])

  const todayKey = localKey(new Date())
  const gridWidth  = columns.length * STEP - GAP
  const gridHeight = 7 * STEP - GAP
  const LEFT_PAD   = 30  // space for day labels

  return (
    <div className="bg-[#1a1d27] border border-gray-800 rounded-2xl p-5 mb-6" ref={containerRef}>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
        <h2 className="text-sm font-semibold text-white">Activity</h2>
        <div className="flex items-center gap-5 text-xs text-gray-400">
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-green-400">{currentStreak}</span>
            <span>Current streak</span>
          </div>
          <div className="w-px h-8 bg-gray-700" />
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-white">{longestStreak}</span>
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
        <div style={{ position: 'relative', width: LEFT_PAD + gridWidth, minWidth: LEFT_PAD + gridWidth }}>

          {/* Month labels row */}
          <div style={{ position: 'relative', height: 18, marginLeft: LEFT_PAD, marginBottom: 4 }}>
            {monthLabels.map((lbl, i) => (
              <span
                key={i}
                style={{
                  position: 'absolute',
                  left: lbl.colIndex * STEP,
                  fontSize: 10,
                  color: '#6b7280',
                  whiteSpace: 'nowrap',
                  lineHeight: '18px',
                }}
              >
                {lbl.name}
              </span>
            ))}
          </div>

          {/* Day labels + grid */}
          <div style={{ display: 'flex' }}>

            {/* Day-of-week labels */}
            <div style={{ width: LEFT_PAD, flexShrink: 0 }}>
              {DAY_LABELS.map((label, i) => (
                <div
                  key={label}
                  style={{
                    height: CELL,
                    marginBottom: i < 6 ? GAP : 0,
                    lineHeight: `${CELL}px`,
                    fontSize: 9,
                    color: '#6b7280',
                    textAlign: 'right',
                    paddingRight: 6,
                    // only show Mon, Wed, Fri to avoid crowding
                    visibility: [1, 3, 5].includes(i) ? 'visible' : 'hidden',
                  }}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Cells */}
            <div style={{ position: 'relative', width: gridWidth, height: gridHeight }}>
              {columns.map((col, ci) =>
                col.map((day, di) => {
                  const key   = localKey(day)
                  const count = countByDay[key] || 0
                  const level = getLevel(count)
                  const isToday = key === todayKey
                  const x = ci * STEP
                  const y = di * STEP

                  return (
                    <div
                      key={key}
                      style={{
                        position: 'absolute',
                        left: x,
                        top: y,
                        width: CELL,
                        height: CELL,
                        borderRadius: 3,
                        backgroundColor: LEVEL_COLORS[level],
                        boxShadow: isToday ? `0 0 0 1.5px #4ade80` : undefined,
                        cursor: 'pointer',
                      }}
                      onMouseEnter={() => setTooltip({ day, count, x, y, ci, di })}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  )
                })
              )}

              {/* Tooltip */}
              {tooltip && (() => {
                const tipW   = 175
                const tipH   = 52
                // Flip to left side if cell is in the right half of the grid
                const flipLeft = tooltip.x > gridWidth / 2
                const left = flipLeft
                  ? tooltip.x - tipW - 4
                  : tooltip.x + CELL + 4
                // Flip to below if tooltip would go above the grid
                const top = tooltip.y - tipH < 0
                  ? tooltip.y + CELL + 4
                  : tooltip.y - tipH + CELL / 2
 
                return (
                  <div
                    style={{
                      position: 'absolute',
                      left,
                      top,
                      width: tipW,
                      pointerEvents: 'none',
                      zIndex: 50,
                    }}
                    className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 shadow-xl"
                  >
                    <p className="text-white text-xs font-semibold">
                      {tooltip.count === 0
                        ? 'No submissions'
                        : `${tooltip.count} submission${tooltip.count > 1 ? 's' : ''}`}
                    </p>
                    <p className="text-gray-400 text-[10px] mt-0.5">
                      {tooltip.day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                )
              })()}
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 10, justifyContent: 'flex-end' }}>
            <span style={{ fontSize: 10, color: '#6b7280', marginRight: 4 }}>Less</span>
            {LEVEL_COLORS.map((color, i) => (
              <div key={i} style={{ width: CELL, height: CELL, borderRadius: 3, backgroundColor: color }} />
            ))}
            <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 4 }}>More</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Profile page ───────────────────────────────────────────────────
const Profile = () => {
  const { user } = useAuth()
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading]         = useState(true)

  useEffect(() => { if (user) fetchSubmissions() }, [user])

  const fetchSubmissions = async () => {
    try {
      const { data } = await API.get(`/submissions/user/${user._id}`)
      setSubmissions(data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const accepted = submissions.filter(s => s.status === 'Accepted')
  const solved   = new Set(accepted.map(s => s.problem?._id)).size
  const rate     = submissions.length ? Math.round((accepted.length / submissions.length) * 100) : 0

  const byDiff = accepted.reduce((acc, s) => {
    const d = s.problem?.difficulty
    if (d) { acc[d] = acc[d] || new Set(); acc[d].add(s.problem._id) }
    return acc
  }, {})

  return (
    <div className="min-h-screen w-full bg-[#0f1117] text-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* User card */}
        <div className="bg-[#1a1d27] border border-gray-800 rounded-2xl p-6 mb-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-green-700 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-semibold">{user?.username}</h1>
            <p className="text-gray-400 text-sm mt-0.5">{user?.email}</p>
            {user?.role === 'admin' && (
              <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-lg bg-purple-900 text-purple-400">Admin</span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Problems Solved',   value: solved },
            { label: 'Total Submissions', value: submissions.length },
            { label: 'Acceptance Rate',   value: `${rate}%` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#1a1d27] border border-gray-800 rounded-2xl p-5 text-center">
              <p className="text-3xl font-bold text-white">{value}</p>
              <p className="text-xs text-gray-400 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Difficulty breakdown */}
        <div className="bg-[#1a1d27] border border-gray-800 rounded-2xl p-5 mb-6">
          <h2 className="text-sm font-medium text-gray-300 mb-4">Solved by Difficulty</h2>
          <div className="flex gap-8">
            {[['Easy','bg-green-500'],['Medium','bg-yellow-500'],['Hard','bg-red-500']].map(([label, dot]) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${dot}`} />
                <span className={`text-sm ${diffStyle[label]}`}>{label}</span>
                <span className="text-sm font-bold text-white">{byDiff[label]?.size || 0}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Heatmap */}
        <ActivityHeatmap submissions={submissions} />

        {/* Recent submissions */}
        <div className="bg-[#1a1d27] border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-sm font-medium text-gray-300">Recent Submissions</h2>
          </div>
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center text-gray-500 py-10 text-sm">No submissions yet</div>
          ) : (
            <div className="divide-y divide-gray-800">
              {submissions.slice(0, 20).map(s => (
                <div key={s._id} className="grid grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-[#1e2130] transition-colors">
                  <div className="col-span-5 text-sm font-medium text-white truncate">{s.problem?.title || '—'}</div>
                  <div className="col-span-2 text-sm"><span className={diffStyle[s.problem?.difficulty]}>{s.problem?.difficulty}</span></div>
                  <div className="col-span-2 text-sm text-gray-400 capitalize">{s.language}</div>
                  <div className="col-span-2">
                    <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${
                      s.status === 'Accepted' ? 'text-green-400 bg-green-950' : 'text-red-400 bg-red-950'
                    }`}>
                      {s.status}
                    </span>
                  </div>
                  <div className="col-span-1 text-xs text-gray-500 text-right">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default Profile;
