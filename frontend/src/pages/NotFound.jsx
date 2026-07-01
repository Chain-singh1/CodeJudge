import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NotFound = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen w-full bg-[#0f1117] flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <Link
        to="/"
        className="text-green-400 font-bold text-xl tracking-tight mb-12"
      >
        Code<span className="text-white">Judge</span>
      </Link>

      <div className="text-center">
        {/* Big 404 */}
        <div className="relative mb-8">
          <p className="text-[120px] font-black text-gray-800 leading-none select-none">
            404
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl">🔍</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">Page not found</h1>
        <p className="text-gray-400 text-sm mb-8 max-w-xs mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 bg-[#1a1d27] hover:bg-gray-800 border border-gray-700 text-gray-300 text-sm font-medium rounded-xl transition-colors"
          >
            ← Go back
          </button>
          <Link
            to={user ? "/" : "/login"}
            className="px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {user ? "Go to Problems" : "Sign in"}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;