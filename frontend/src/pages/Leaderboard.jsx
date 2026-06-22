import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";

const Leaderboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data } = await API.get("/leaderboard");
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0f1117] text-white">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-3 py-3 sm:py-4">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-semibold">Leaderboard</h1>
          <p className="text-gray-400 text-sm mt-1">
            Ranked by problems solved
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-7 h-7 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Podium — only on sm+ */}
            {users.length >= 3 && (
              <div className="hidden sm:flex items-end justify-center gap-6 mb-10">
                {/* 2nd */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-xl font-bold mb-2 text-white">
                    {users[1]?.username?.[0]?.toUpperCase()}
                  </div>
                  <p className="text-sm font-medium text-gray-200">
                    {users[1]?.username}
                  </p>
                  <p className="text-xs text-gray-500 mb-2">
                    {users[1]?.solvedCount} solved
                  </p>
                  <div className="w-20 h-14 bg-gray-700 rounded-t-lg flex items-center justify-center text-2xl">
                    🥈
                  </div>
                </div>
                {/* 1st */}
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-yellow-600 flex items-center justify-center text-2xl font-bold mb-2 text-white">
                    {users[0]?.username?.[0]?.toUpperCase()}
                  </div>
                  <p className="text-sm font-semibold text-white">
                    {users[0]?.username}
                  </p>
                  <p className="text-xs text-gray-400 mb-2">
                    {users[0]?.solvedCount} solved
                  </p>
                  <div className="w-20 h-20 bg-yellow-900 rounded-t-lg flex items-center justify-center text-3xl">
                    🥇
                  </div>
                </div>
                {/* 3rd */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-orange-800 flex items-center justify-center text-xl font-bold mb-2 text-white">
                    {users[2]?.username?.[0]?.toUpperCase()}
                  </div>
                  <p className="text-sm font-medium text-gray-200">
                    {users[2]?.username}
                  </p>
                  <p className="text-xs text-gray-500 mb-2">
                    {users[2]?.solvedCount} solved
                  </p>
                  <div className="w-20 h-10 bg-orange-900 rounded-t-lg flex items-center justify-center text-xl">
                    🥉
                  </div>
                </div>
              </div>
            )}

            {/* Table */}
            <div className="bg-[#1a1d27] border border-gray-800 rounded-2xl overflow-hidden">
              {/* Desktop header */}
              <div className="hidden sm:grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-4 border-b border-gray-800">
                <div className="col-span-1">Rank</div>
                <div className="col-span-7">User</div>
                <div className="col-span-2">Solved</div>
                <div className="col-span-2">Submissions</div>
              </div>
              {/* Mobile header */}
              <div className="sm:hidden flex text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 border-b border-gray-800 gap-3">
                <div className="w-8">Rank</div>
                <div className="flex-1">User</div>
                <div className="w-14 text-right">Solved</div>
              </div>

              {users.length === 0 ? (
                <div className="text-center text-gray-500 py-16 text-sm">
                  No data yet
                </div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {users.map((u, i) => {
                    const isMe = u._id === currentUser?._id;
                    return (
                      <div
                        key={u._id}
                        className={`transition-colors ${
                          isMe
                            ? "bg-green-950 bg-opacity-30"
                            : "hover:bg-[#1e2130]"
                        }`}
                      >
                        {/* Mobile row */}
                        <div className="sm:hidden flex items-center px-4 py-3.5 gap-3">
                          <div className="w-8 text-sm font-bold text-gray-400 flex-shrink-0">
                            {i === 0
                              ? "🥇"
                              : i === 1
                                ? "🥈"
                                : i === 2
                                  ? "🥉"
                                  : `#${i + 1}`}
                          </div>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium text-white flex-shrink-0 ${isMe ? "bg-green-700" : "bg-gray-700"}`}
                            >
                              {u.username?.[0]?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <span
                                className={`text-sm font-medium truncate block ${isMe ? "text-green-400" : "text-white"}`}
                              >
                                {u.username}
                                {isMe && (
                                  <span className="text-xs text-green-600 ml-1">
                                    (you)
                                  </span>
                                )}
                              </span>
                              <span className="text-xs text-gray-500">
                                {u.totalSubmissions} submissions
                              </span>
                            </div>
                          </div>
                          <div className="w-14 text-center text-sm font-bold text-white flex-shrink-0">
                            {u.solvedCount}
                          </div>
                        </div>

                        {/* Desktop row */}
                        <div className="hidden sm:grid grid-cols-12 gap-4 items-center px-6 py-4">
                          <div className="col-span-1 text-sm font-semibold text-gray-400">
                            {i === 0
                              ? "🥇"
                              : i === 1
                                ? "🥈"
                                : i === 2
                                  ? "🥉"
                                  : `#${i + 1}`}
                          </div>
                          <div className="col-span-7 flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white ${isMe ? "bg-green-700" : "bg-gray-700"}`}
                            >
                              {u.username?.[0]?.toUpperCase()}
                            </div>
                            <span
                              className={`text-sm font-medium ${isMe ? "text-green-400" : "text-white"}`}
                            >
                              {u.username}
                              {isMe && (
                                <span className="text-xs text-green-600 ml-2">
                                  (you)
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="col-span-2 ml-4 text-sm font-bold text-white">
                            {u.solvedCount}
                          </div>
                          <div className="col-span-2 ml-9 text-sm text-gray-400">
                            {u.totalSubmissions}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
