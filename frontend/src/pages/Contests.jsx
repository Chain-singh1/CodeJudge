import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import API from "../services/api";

const statusStyle = {
  upcoming: "text-blue-400 bg-blue-950",
  active: "text-green-400 bg-green-950",
  ended: "text-gray-400 bg-gray-800",
};

const getStatus = (start, end) => {
  const now = new Date();
  if (new Date(start) > now) return "upcoming";
  if (new Date(end) > now) return "active";
  return "ended";
};

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const Contests = () => {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchContests();
  }, []);

  const fetchContests = async () => {
    try {
      const { data } = await API.get("/contests");
      setContests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0f1117] text-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-3 py-4">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Contests</h1>
          <p className="text-gray-400 text-sm mt-1">
            Compete and climb the leaderboard
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-7 h-7 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : contests.length === 0 ? (
          <div className="text-center text-gray-500 py-24 text-sm">
            No contests available
          </div>
        ) : (
          <div className="space-y-3">
            {contests.map((contest) => {
              const status = getStatus(contest.startTime, contest.endTime);
              return (
                <div
                  key={contest._id}
                  onClick={() => navigate(`/contests/${contest._id}`)}
                  className="bg-[#1a1d27] border border-gray-800 hover:border-gray-700 rounded-2xl p-6 cursor-pointer transition-all hover:bg-[#1e2130]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="font-semibold text-white text-lg">
                          {contest.title}
                        </h2>
                        <span
                          className={`text-xs px-2.5 py-1 rounded-lg font-medium capitalize ${statusStyle[status]}`}
                        >
                          {status}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                        {contest.description}
                      </p>
                      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                        <span>🕐 Start: {formatDate(contest.startTime)}</span>
                        <span>🏁 End: {formatDate(contest.endTime)}</span>
                        <span>📋 {contest.problems?.length || 0} problems</span>
                      </div>
                    </div>

                    <button
                      className={`flex-shrink-0 text-sm px-5 py-2 rounded-xl font-medium transition-colors ${
                        status === "active"
                          ? "bg-green-600 hover:bg-green-500 text-white"
                          : status === "upcoming"
                            ? "bg-blue-900 text-blue-400 cursor-default"
                            : "bg-gray-800 text-gray-400 cursor-default"
                      }`}
                    >
                      {status === "active"
                        ? "Enter →"
                        : status === "upcoming"
                          ? "Upcoming"
                          : "View"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Contests;