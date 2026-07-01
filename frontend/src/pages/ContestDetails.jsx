import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";

const diffStyle = {
  Easy: "text-green-400 bg-green-950",
  Medium: "text-yellow-400 bg-yellow-950",
  Hard: "text-red-400 bg-red-950",
};

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const useCountdown = (targetDate) => {
  const [timeLeft, setTimeLeft] = useState(null);
  const ref = useRef(null);
  useEffect(() => {
    if (!targetDate) return;
    const tick = () => {
      const diff = new Date(targetDate) - new Date();
      if (diff <= 0) {
        setTimeLeft(null);
        clearInterval(ref.current);
        return;
      }
      setTimeLeft({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
        diff,
      });
    };
    tick();
    ref.current = setInterval(tick, 1000);
    return () => clearInterval(ref.current);
  }, [targetDate]);
  return timeLeft;
};

const pad = (n) => String(n).padStart(2, "0");

const ContestTimer = ({ contest }) => {
  const now = new Date();
  const isUpcoming = new Date(contest.startTime) > now;
  const isActive =
    new Date(contest.startTime) <= now && new Date(contest.endTime) > now;
  const target = isUpcoming
    ? contest.startTime
    : isActive
      ? contest.endTime
      : null;
  const timeLeft = useCountdown(target);
  if (!target || !timeLeft) return null;
  const urgent = isActive && timeLeft.diff < 5 * 60 * 1000;
  return (
    <div
      className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border flex-shrink-0 ${
        urgent
          ? "bg-red-950 border-red-800"
          : isActive
            ? "bg-green-950 border-green-800"
            : "bg-blue-950 border-blue-800"
      }`}
    >
      <span
        className={`text-xs font-medium ${urgent ? "text-red-400" : isActive ? "text-green-400" : "text-blue-400"}`}
      >
        {isUpcoming ? "Starts in" : urgent ? "⚠ Ending soon" : "Time left"}
      </span>
      <span
        className={`font-mono font-bold text-base sm:text-lg tracking-widest ${
          urgent
            ? "text-red-300"
            : isActive
              ? "text-green-300"
              : "text-blue-300"
        }`}
      >
        {timeLeft.h > 0 && <span>{pad(timeLeft.h)}:</span>}
        {pad(timeLeft.m)}:{pad(timeLeft.s)}
      </span>
    </div>
  );
};

const ContestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [contest, setContest] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [globalSolved, setGlobalSolved] = useState(new Set());
  const [tab, setTab] = useState("problems");
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    fetchContest();
    fetchSubmissions();
    fetchGlobalSolved();
  }, [id]);

  const fetchContest = async () => {
    try {
      const { data } = await API.get(`/contests/${id}`);
      setContest(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const { data } = await API.get(`/contest-submissions/${id}`);
      setSubmissions(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGlobalSolved = async () => {
    try {
      if (!user) return;
      const { data } = await API.get(`/submissions/user/${user._id}`);
      setGlobalSolved(
        new Set(
          data
            .filter((s) => s.status === "Accepted")
            .map((s) => s.problem?._id)
            .filter(Boolean),
        ),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoin = async () => {
    setJoining(true);
    try {
      await API.post(`/contests/${id}/join`);
      await fetchContest();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to join contest");
    } finally {
      setJoining(false);
    }
  };

  const now = new Date();
  const isUpcoming = contest && new Date(contest.startTime) > now;
  const isActive =
    contest &&
    new Date(contest.startTime) <= now &&
    new Date(contest.endTime) > now;
  const isEnded = contest && new Date(contest.endTime) <= now;

  const hasJoined =
    contest?.participants?.some((p) => {
      const pid = p._id || p;
      return pid?.toString() === user?._id?.toString();
    }) ?? false;

  const canSeeProblems = isAdmin || (hasJoined && (isActive || isEnded));

  const leaderboard = Object.values(
    submissions.reduce((acc, s) => {
      const uid = s.user?._id;
      if (!uid) return acc;
      if (!acc[uid])
        acc[uid] = { user: s.user, solved: new Set(), attempts: 0 };
      acc[uid].attempts++;
      if (s.status === "Accepted") acc[uid].solved.add(s.problem?._id);
      return acc;
    }, {}),
  )
    .map((e) => ({ ...e, solvedCount: e.solved.size }))
    .sort((a, b) => b.solvedCount - a.solvedCount || a.attempts - b.attempts);

  const myRank = leaderboard.findIndex((e) => e.user._id === user?._id);

  if (loading)
    return (
      <div className="min-h-screen w-full bg-[#0f1117] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-7 h-7 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );

  if (!contest)
    return (
      <div className="min-h-screen w-full bg-[#0f1117] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
          Contest not found
        </div>
      </div>
    );

  return (
    <div className="min-h-screen w-full bg-[#0f1117] text-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="bg-[#1a1d27] border border-gray-800 rounded-2xl p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-lg sm:text-xl font-semibold">
                  {contest.title}
                </h1>
                <span
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium ${
                    isActive
                      ? "text-green-400 bg-green-950"
                      : isUpcoming
                        ? "text-blue-400 bg-blue-950"
                        : "text-gray-400 bg-gray-800"
                  }`}
                >
                  {isActive ? "Active" : isUpcoming ? "Upcoming" : "Ended"}
                </span>
                {hasJoined && (
                  <span className="text-xs px-2.5 py-1 rounded-lg font-medium text-purple-400 bg-purple-950">
                    ✓ Registered
                  </span>
                )}
                {isAdmin && (
                  <span className="text-xs px-2.5 py-1 rounded-lg font-medium text-yellow-400 bg-yellow-950">
                    Admin view
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-sm mb-3 leading-relaxed">
                {contest.description}
              </p>
              <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                <span>🕐 {formatDate(contest.startTime)}</span>
                <span>🏁 {formatDate(contest.endTime)}</span>
                <span>📋 {contest.problems?.length || 0} problems</span>
                <span>👥 {contest.participants?.length || 0} registered</span>
                {myRank !== -1 && (
                  <span className="text-green-400">🏆 Rank #{myRank + 1}</span>
                )}
              </div>
            </div>
            <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3">
              <ContestTimer contest={contest} />
              {!isAdmin && !hasJoined && !isEnded && (
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="px-4 sm:px-5 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap"
                >
                  {joining ? "Joining..." : "Join Contest"}
                </button>
              )}
              {!isAdmin && hasJoined && isUpcoming && (
                <p className="text-xs text-gray-400">
                  Problems unlock when contest starts
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-800 mb-5">
          {["problems", "leaderboard"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 sm:px-5 py-2.5 text-sm capitalize border-b-2 transition-colors font-medium ${
                tab === t
                  ? "text-white border-green-400"
                  : "text-gray-400 border-transparent hover:text-gray-200"
              }`}
            >
              {t}
              {t === "leaderboard" && leaderboard.length > 0 && (
                <span className="ml-2 text-xs bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded-full">
                  {leaderboard.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Problems tab */}
        {tab === "problems" && (
          <div>
            {!canSeeProblems && !hasJoined && (
              <div className="text-center py-12 sm:py-16 bg-[#1a1d27] border border-gray-800 rounded-2xl px-4">
                <div className="text-4xl mb-4">🔒</div>
                <p className="text-white font-semibold mb-2">
                  Register to access problems
                </p>
                <p className="text-gray-400 text-sm mb-6">
                  {isEnded
                    ? "This contest has ended and registration is closed."
                    : "Join the contest to access the problem list once it starts."}
                </p>
                {!isEnded && (
                  <button
                    onClick={handleJoin}
                    disabled={joining}
                    className="px-6 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    {joining ? "Joining..." : "Join Contest"}
                  </button>
                )}
              </div>
            )}

            {!canSeeProblems && hasJoined && isUpcoming && (
              <div className="text-center py-12 sm:py-16 bg-[#1a1d27] border border-gray-800 rounded-2xl px-4">
                <div className="text-4xl mb-4">⏳</div>
                <p className="text-white font-semibold mb-2">
                  You're registered!
                </p>
                <p className="text-gray-400 text-sm mb-4">
                  Problems will be revealed when the contest begins.
                </p>
                <div className="flex justify-center">
                  <ContestTimer contest={contest} />
                </div>
              </div>
            )}

            {canSeeProblems && (
              <div className="space-y-2">
                {!contest.problems?.length ? (
                  <p className="text-gray-500 text-sm text-center py-12">
                    No problems added yet.
                  </p>
                ) : (
                  contest.problems.map((problem, i) => {
                    const solvedInContest =
                      submissions.some(
                        (s) =>
                          s.user?._id === user?._id &&
                          s.problem?._id === problem._id &&
                          s.status === "Accepted",
                      ) || globalSolved.has(problem._id);
                    return (
                      <div
                        key={problem._id}
                        onClick={() =>
                          navigate(
                            isActive
                              ? `/problem/${problem._id}?contestId=${id}`
                              : `/problem/${problem._id}`,
                          )
                        }
                        className={`cursor-pointer rounded-xl border transition-all ${
                          solvedInContest
                            ? "bg-green-950 bg-opacity-20 border-green-900 border-opacity-40 hover:border-green-700"
                            : "bg-[#1a1d27] border-transparent hover:bg-[#1e2130] hover:border-gray-700"
                        }`}
                      >
                        {/* Mobile */}
                        <div className="sm:hidden px-4 py-3.5 flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {solvedInContest ? (
                              <svg
                                className="w-4 h-4 text-green-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2.5}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            ) : (
                              <span className="text-gray-500 text-sm font-medium">
                                {i + 1}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-medium truncate ${solvedInContest ? "text-green-300" : "text-white"}`}
                            >
                              {problem.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className={`text-xs px-2 py-0.5 rounded-lg font-medium ${diffStyle[problem.difficulty]}`}
                              >
                                {problem.difficulty}
                              </span>
                              {problem.tags?.[0] && (
                                <span className="text-xs text-gray-500">
                                  {problem.tags[0]}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* Desktop */}
                        <div className="hidden sm:grid grid-cols-12 gap-4 items-center px-5 py-4">
                          <div className="col-span-1 flex items-center justify-center">
                            {solvedInContest ? (
                              <svg
                                className="w-4 h-4 text-green-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2.5}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            ) : (
                              <span className="text-gray-500 text-sm font-medium">
                                {i + 1}
                              </span>
                            )}
                          </div>
                          <div
                            className={`col-span-7 text-sm font-medium ${solvedInContest ? "text-green-300" : "text-white"}`}
                          >
                            {problem.title}
                          </div>
                          <div className="col-span-2">
                            <span
                              className={`text-xs px-2.5 py-1 rounded-lg font-medium ${diffStyle[problem.difficulty]}`}
                            >
                              {problem.difficulty}
                            </span>
                          </div>
                          <div className="col-span-2 text-xs text-gray-500">
                            {problem.tags?.[0] || ""}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

        {/* Leaderboard tab */}
        {tab === "leaderboard" &&
          (leaderboard.length === 0 ? (
            <div className="text-center py-12 sm:py-16 bg-[#1a1d27] border border-gray-800 rounded-2xl">
              <div className="text-4xl mb-4">🏆</div>
              <p className="text-gray-400 text-sm">
                No submissions yet. Be the first!
              </p>
            </div>
          ) : (
            <div className="bg-[#1a1d27] border border-gray-800 rounded-2xl overflow-hidden">
              {/* Desktop header */}
              <div className="hidden sm:grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-4 border-b border-gray-800">
                <div className="col-span-1">Rank</div>
                <div className="col-span-6">User</div>
                <div className="col-span-3 text-center">Solved</div>
                <div className="col-span-2 text-center">Attempts</div>
              </div>
              {/* Mobile header */}
              <div className="sm:hidden flex text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 border-b border-gray-800 gap-3">
                <div className="w-8">Rank</div>
                <div className="flex-1">User</div>
                <div className="w-16 text-right">Solved</div>
              </div>

              <div className="divide-y divide-gray-800">
                {leaderboard.map((entry, i) => {
                  const isMe = entry.user._id === user?._id;
                  return (
                    <div
                      key={entry.user._id}
                      className={`transition-colors ${
                        isMe
                          ? "bg-green-950 bg-opacity-20"
                          : i === 0
                            ? "bg-yellow-950 bg-opacity-20"
                            : i === 1
                              ? "bg-gray-600 bg-opacity-10"
                              : i === 2
                                ? "bg-orange-950 bg-opacity-10"
                                : "hover:bg-[#1e2130]"
                      }`}
                    >
                      {/* Mobile row */}
                      <div className="sm:hidden flex items-center px-4 py-3.5 gap-3">
                        <div className="w-8 text-sm font-bold flex-shrink-0">
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
                            {entry.user.username?.[0]?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span
                              className={`text-sm font-medium truncate block ${isMe ? "text-green-400" : "text-white"}`}
                            >
                              {entry.user.username}
                              {isMe && (
                                <span className="text-xs text-green-600 ml-1">
                                  (you)
                                </span>
                              )}
                            </span>
                            <span className="text-xs text-gray-500">
                              {entry.attempts} attempts
                            </span>
                          </div>
                        </div>
                        <div className="w-16 text-right">
                          <span className="text-sm font-bold text-green-400">
                            {entry.solvedCount}
                          </span>
                          <span className="text-xs text-gray-500 ml-1">
                            / {contest.problems?.length || 0}
                          </span>
                        </div>
                      </div>
                      {/* Desktop row */}
                      <div className="hidden sm:grid grid-cols-12 gap-4 items-center px-6 py-4">
                        <div className="col-span-1 text-sm font-bold">
                          {i === 0
                            ? "🥇"
                            : i === 1
                              ? "🥈"
                              : i === 2
                                ? "🥉"
                                : `#${i + 1}`}
                        </div>
                        <div className="col-span-6 flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white ${isMe ? "bg-green-700" : "bg-gray-700"}`}
                          >
                            {entry.user.username?.[0]?.toUpperCase()}
                          </div>
                          <span
                            className={`text-sm font-medium ${isMe ? "text-green-400" : "text-white"}`}
                          >
                            {entry.user.username}
                            {isMe && (
                              <span className="text-xs text-green-600 ml-1">
                                (you)
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="col-span-3 text-sm font-bold text-green-400 text-center">
                          {entry.solvedCount}
                          <span className="text-xs text-gray-500 font-normal ml-1">
                            / {contest.problems?.length || 0}
                          </span>
                        </div>
                        <div className="col-span-2 text-sm text-gray-400 text-center">
                          {entry.attempts}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default ContestDetails;