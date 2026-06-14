import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import API from '../services/api'
import { useAuth } from '../context/AuthContext'

const Leaderboard = () => {
  const [users, setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const { user: currentUser } = useAuth()

  useEffect(() => { fetchLeaderboard() }, [])

  const fetchLeaderboard = async () => {
    try {
      const { data } = await API.get('/leaderboard')
      setUsers(data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen w-full bg-[#0f1117] text-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-3 py-4">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Leaderboard</h1>
          <p className="text-gray-400 text-sm mt-1">Ranked by problems solved</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-7 h-7 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Podium — only show when ≥ 3 users */}
            {users.length >= 3 && (
              <div className="flex items-end justify-center gap-6 mb-10">
                {/* 2nd */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-xl font-bold mb-2 text-white">
                    {users[1]?.username?.[0]?.toUpperCase()}
                  </div>
                  <p className="text-sm font-medium text-gray-200">{users[1]?.username}</p>
                  <p className="text-xs text-gray-500 mb-2">{users[1]?.solvedCount} solved</p>
                  <div className="w-20 h-14 bg-gray-700 rounded-t-lg flex items-center justify-center text-2xl">🥈</div>
                </div>
                {/* 1st */}
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-yellow-600 flex items-center justify-center text-2xl font-bold mb-2 text-white">
                    {users[0]?.username?.[0]?.toUpperCase()}
                  </div>
                  <p className="text-sm font-semibold text-white">{users[0]?.username}</p>
                  <p className="text-xs text-gray-400 mb-2">{users[0]?.solvedCount} solved</p>
                  <div className="w-20 h-20 bg-yellow-900 rounded-t-lg flex items-center justify-center text-3xl">🥇</div>
                </div>
                {/* 3rd */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-orange-800 flex items-center justify-center text-xl font-bold mb-2 text-white">
                    {users[2]?.username?.[0]?.toUpperCase()}
                  </div>
                  <p className="text-sm font-medium text-gray-200">{users[2]?.username}</p>
                  <p className="text-xs text-gray-500 mb-2">{users[2]?.solvedCount} solved</p>
                  <div className="w-20 h-10 bg-orange-900 rounded-t-lg flex items-center justify-center text-xl">🥉</div>
                </div>
              </div>
            )}

            {/* Table */}
            <div className="bg-[#1a1d27] border border-gray-800 rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-4 border-b border-gray-800">
                <div className="col-span-1">Rank</div>
                <div className="col-span-7">User</div>
                <div className="col-span-2">Solved</div>
                <div className="col-span-2">Submissions</div>
              </div>

              {users.length === 0 ? (
                <div className="text-center text-gray-500 py-16 text-sm">No data yet</div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {users.map((u, i) => (
                    <div
                      key={u._id}
                      className={`grid grid-cols-12 gap-4 items-center px-6 py-4 transition-colors ${
                        u._id === currentUser?._id ? 'bg-green-950 bg-opacity-30' : 'hover:bg-[#1e2130]'
                      }`}
                    >
                      <div className="col-span-1 text-sm font-semibold text-gray-400">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                      </div>
                      <div className="col-span-7 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-medium text-white">
                          {u.username?.[0]?.toUpperCase()}
                        </div>
                        <span className={`text-sm font-medium ${u._id === currentUser?._id ? 'text-green-400' : 'text-white'}`}>
                          {u.username}
                          {u._id === currentUser?._id && (
                            <span className="text-xs text-green-600 ml-2">(you)</span>
                          )}
                        </span>
                      </div>
                      <div className="col-span-2 text-sm font-bold text-white">{u.solvedCount}</div>
                      <div className="col-span-2 text-sm text-gray-400">{u.totalSubmissions}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Leaderboard
