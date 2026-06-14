// import { useEffect, useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import Navbar from '../components/Navbar'
// import API from '../services/api'
// import { useAuth } from '../context/AuthContext'

// const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard']

// const diffStyle = {
//   Easy:   'text-green-400 bg-green-950',
//   Medium: 'text-yellow-400 bg-yellow-950',
//   Hard:   'text-red-400 bg-red-950',
// }

// const Problems = () => {
//   const [problems, setProblems]     = useState([])
//   const [filtered, setFiltered]     = useState([])
//   const [search, setSearch]         = useState('')
//   const [difficulty, setDifficulty] = useState('All')
//   const [loading, setLoading]       = useState(true)
//   const [solvedIds, setSolvedIds]   = useState(new Set())
//   const { user } = useAuth()
//   const navigate = useNavigate()

//   useEffect(() => { fetchProblems(); fetchSolved() }, [])

//   useEffect(() => {
//     let list = [...problems]
//     if (search)               list = list.filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
//     if (difficulty !== 'All') list = list.filter(p => p.difficulty === difficulty)
//     setFiltered(list)
//   }, [search, difficulty, problems])

//   const fetchProblems = async () => {
//     try {
//       const { data } = await API.get('/problems')
//       setProblems(data)
//       setFiltered(data)
//     } catch (err) { console.error(err) }
//     finally { setLoading(false) }
//   }

//   const fetchSolved = async () => {
//     try {
//       if (!user) return
//       const { data } = await API.get(`/submissions/user/${user._id}`)
//       const ids = new Set(
//         data
//           .filter(s => s.status === 'Accepted')
//           .map(s => s.problem?._id)
//           .filter(Boolean)
//       )
//       setSolvedIds(ids)
//     } catch (err) { console.error(err) }
//   }

//   return (
//     <div className="min-h-screen w-full bg-[#0f1117] text-white">
//       <Navbar />

//       <div className="max-w-7xl mx-auto px-3 py-4">
//         {/* Header */}
//         <div className="mb-6">
//           <h1 className="text-2xl font-semibold">Problems</h1>
//           <p className="text-gray-400 text-sm mt-1">
//             {problems.length} problems · {solvedIds.size} solved
//           </p>
//         </div>

//         {/* Filters */}
//         <div className="flex flex-wrap gap-3 mb-6">
//           <input
//             type="text"
//             placeholder="Search problems..."
//             value={search}
//             onChange={e => setSearch(e.target.value)}
//             className="bg-[#1a1d27] border border-gray-700 rounded-xl px-4 py-2.5 text-sm w-72 outline-none focus:border-green-500 transition-colors placeholder-gray-600 text-white"
//           />
//           <div className="relative">
//             <select
//               value={difficulty}
//               onChange={e => setDifficulty(e.target.value)}
//               className="appearance-none bg-[#1a1d27] border border-gray-700 rounded-xl px-4 py-2.5 pr-9 text-sm outline-none focus:border-green-500 transition-colors cursor-pointer text-white hover:border-gray-600"
//             >
//               {DIFFICULTIES.map(d => (
//                 <option key={d} value={d}>{d === 'All' ? 'All' : d}</option>
//               ))}
//             </select>
//             <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
//               <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
//               </svg>
//             </div>
//           </div>
//         </div>

//         {/* Table header */}
//         <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider px-4 mb-2">
//           <div className="col-span-1">Status</div>
//           <div className="col-span-1">#</div>
//           <div className="col-span-5">Title</div>
//           <div className="col-span-2">Difficulty</div>
//           <div className="col-span-3">Tags</div>
//         </div>

//         {/* Rows */}
//         {loading ? (
//           <div className="flex justify-center py-24">
//             <div className="w-7 h-7 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
//           </div>
//         ) : filtered.length === 0 ? (
//           <div className="text-center text-gray-500 py-24 text-sm">No problems found</div>
//         ) : (
//           <div className="space-y-1">
//             {filtered.map((problem, index) => {
//               const solved = solvedIds.has(problem._id)
//               return (
//                 <div
//                   key={problem._id}
//                   onClick={() => navigate(`/problem/${problem._id}`)}
//                   className={`grid grid-cols-12 gap-4 items-center px-4 py-4 rounded-xl border cursor-pointer transition-all ${
//                     solved
//                       ? 'bg-green-950 bg-opacity-20 border-green-900 border-opacity-40 hover:border-green-700'
//                       : 'bg-[#1a1d27] border-transparent hover:bg-[#1e2130] hover:border-gray-700'
//                   }`}
//                 >
//                   {/* Status icon */}
//                   <div className="col-span-1 flex items-center justify-center">
//                     {solved ? (
//                       <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
//                       </svg>
//                     ) : (
//                       <div className="w-4 h-4 rounded-full border border-gray-700" />
//                     )}
//                   </div>
//                   <div className="col-span-1 text-gray-500 text-sm">{index + 1}</div>
//                   <div className={`col-span-5 text-sm font-medium ${solved ? 'text-green-300' : 'text-white'}`}>
//                     {problem.title}
//                   </div>
//                   <div className="col-span-2">
//                     <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${diffStyle[problem.difficulty]}`}>
//                       {problem.difficulty}
//                     </span>
//                   </div>
//                   <div className="col-span-3 flex gap-1.5 flex-wrap">
//                     {problem.tags?.slice(0, 2).map((tag, i) => (
//                       <span key={i} className="text-xs px-2 py-0.5 rounded-lg bg-gray-800 text-gray-400">{tag}</span>
//                     ))}
//                   </div>
//                 </div>
//               )
//             })}
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }

// export default Problems;



import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import API from '../services/api'
import { useAuth } from '../context/AuthContext'

const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard']
const PAGE_SIZE    = 20

const diffStyle = {
  Easy:   'text-green-400 bg-green-950',
  Medium: 'text-yellow-400 bg-yellow-950',
  Hard:   'text-red-400 bg-red-950',
}

const Problems = () => {
  const [problems, setProblems]       = useState([])
  const [solvedIds, setSolvedIds]     = useState(new Set())
  const [search, setSearch]           = useState('')
  const [difficulty, setDifficulty]   = useState('All')
  const [activeTag, setActiveTag]     = useState(null)
  const [page, setPage]               = useState(1)
  const [loading, setLoading]         = useState(true)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => { fetchProblems(); fetchSolved() }, [])

  // Reset to page 1 whenever filters change
  useEffect(() => { setPage(1) }, [search, difficulty, activeTag])

  const fetchProblems = async () => {
    try {
      const { data } = await API.get('/problems')
      setProblems(data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const fetchSolved = async () => {
    try {
      if (!user) return
      const { data } = await API.get(`/submissions/user/${user._id}`)
      const ids = new Set(
        data
          .filter(s => s.status === 'Accepted')
          .map(s => s.problem?._id)
          .filter(Boolean)
      )
      setSolvedIds(ids)
    } catch (err) { console.error(err) }
  }

  // Collect all unique tags from all problems
  const allTags = useMemo(() => {
    const tagSet = new Set()
    problems.forEach(p => p.tags?.forEach(t => tagSet.add(t)))
    return Array.from(tagSet).sort()
  }, [problems])

  // Apply all filters
  const filtered = useMemo(() => {
    let list = [...problems]
    if (search)           list = list.filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
    if (difficulty !== 'All') list = list.filter(p => p.difficulty === difficulty)
    if (activeTag)        list = list.filter(p => p.tags?.includes(activeTag))
    return list
  }, [problems, search, difficulty, activeTag])

  // Paginate
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleTagClick = (tag) => {
    setActiveTag(prev => prev === tag ? null : tag)
  }

  return (
    <div className="min-h-screen w-full bg-[#0f1117] text-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-3 py-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Problems</h1>
          <p className="text-gray-400 text-sm mt-1">
            {problems.length} problems · {solvedIds.size} solved
          </p>
        </div>

        {/* Search + difficulty filter */}
        <div className="flex flex-wrap gap-3 mb-4">
          <input
            type="text"
            placeholder="Search problems..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-[#1a1d27] border border-gray-700 rounded-xl px-4 py-2.5 text-sm w-72 outline-none focus:border-green-500 transition-colors placeholder-gray-600 text-white"
          />
          <div className="relative">
            <select
              value={difficulty}
              onChange={e => setDifficulty(e.target.value)}
              className="appearance-none bg-[#1a1d27] border border-gray-700 rounded-xl px-4 py-2.5 pr-9 text-sm outline-none focus:border-green-500 transition-colors cursor-pointer text-white hover:border-gray-600"
            >
              {DIFFICULTIES.map(d => (
                <option key={d} value={d}>{d === 'All' ? 'All' : d}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Tag filter chips */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  activeTag === tag
                    ? 'bg-green-700 border-green-600 text-white'
                    : 'bg-[#1a1d27] border-gray-700 text-gray-400 hover:border-green-700 hover:text-green-400'
                }`}
              >
                {tag}
              </button>
            ))}
            {activeTag && (
              <button
                onClick={() => setActiveTag(null)}
                className="text-xs px-3 py-1 rounded-full border border-red-800 text-red-400 bg-red-950 hover:bg-red-900 transition-colors"
              >
                ✕ Clear
              </button>
            )}
          </div>
        )}

        {/* Table header */}
        <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider px-4 mb-2">
          <div className="col-span-1">Status</div>
          <div className="col-span-1">#</div>
          <div className="col-span-5">Title</div>
          <div className="col-span-2">Difficulty</div>
          <div className="col-span-3">Tags</div>
        </div>

        {/* Rows */}
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-7 h-7 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : paginated.length === 0 ? (
          <div className="text-center text-gray-500 py-24 text-sm">No problems found</div>
        ) : (
          <div className="space-y-1">
            {paginated.map((problem, index) => {
              const solved = solvedIds.has(problem._id)
              const globalIndex = (page - 1) * PAGE_SIZE + index + 1
              return (
                <div
                  key={problem._id}
                  onClick={() => navigate(`/problem/${problem._id}`)}
                  className={`grid grid-cols-12 gap-4 items-center px-4 py-4 rounded-xl border cursor-pointer transition-all ${
                    solved
                      ? 'bg-green-950 bg-opacity-20 border-green-900 border-opacity-40 hover:border-green-700'
                      : 'bg-[#1a1d27] border-transparent hover:bg-[#1e2130] hover:border-gray-700'
                  }`}
                >
                  <div className="col-span-1 flex items-center justify-center">
                    {solved ? (
                      <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-gray-700" />
                    )}
                  </div>
                  <div className="col-span-1 text-gray-500 text-sm">{globalIndex}</div>
                  <div className={`col-span-5 text-sm font-medium ${solved ? 'text-green-300' : 'text-white'}`}>
                    {problem.title}
                  </div>
                  <div className="col-span-2">
                    <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${diffStyle[problem.difficulty]}`}>
                      {problem.difficulty}
                    </span>
                  </div>
                  <div className="col-span-3 flex gap-1.5 flex-wrap">
                    {problem.tags?.slice(0, 2).map((tag, i) => (
                      <button
                        key={i}
                        onClick={e => { e.stopPropagation(); handleTagClick(tag) }}
                        className={`text-xs px-2 py-0.5 rounded-lg transition-colors ${
                          activeTag === tag
                            ? 'bg-green-800 text-green-200'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg bg-[#1a1d27] border border-gray-700 text-sm text-gray-400 hover:text-white hover:border-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Prev
              </button>

              {/* Page numbers */}
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...')
                    acc.push(p)
                    return acc
                  }, [])
                  .map((p, i) =>
                    p === '...' ? (
                      <span key={`ellipsis-${i}`} className="px-2 py-1.5 text-sm text-gray-600">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                          page === p
                            ? 'bg-green-600 text-white'
                            : 'bg-[#1a1d27] border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
              </div>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg bg-[#1a1d27] border border-gray-700 text-sm text-gray-400 hover:text-white hover:border-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Problems;