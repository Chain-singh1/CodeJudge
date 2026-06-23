import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    logout();
    navigate("/login");
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { to: "/", label: "Problems" },
    { to: "/contests", label: "Contests" },
    { to: "/leaderboard", label: "Leaderboard" },
    { to: "/playground", label: "Playground" },
    ...(isAdmin ? [{ to: "/admin", label: "Admin" }] : []),
  ];

  return (
    <>
      <nav className="h-12 bg-[#0f1117] border-b border-gray-800 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 relative z-40">
        {/* Logo */}
        <Link
          to="/"
          className="text-green-400 font-bold text-lg tracking-tight flex-shrink-0"
        >
          Code<span className="text-white">Judge</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`text-sm transition-colors ${
                isActive(to)
                  ? "text-white font-medium"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Desktop user dropdown */}
          <div className="hidden md:block relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 focus:outline-none group"
            >
              <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center text-sm font-bold text-white group-hover:bg-green-600 transition-colors">
                {user?.username?.[0]?.toUpperCase() || "U"}
              </div>
              <svg
                className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-[#1a1d27] border border-gray-700 rounded-xl shadow-xl overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-gray-800">
                  <p className="text-sm font-medium text-white">
                    {user?.username}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {user?.email}
                  </p>
                </div>
                <div className="py-1">
                  <Link
                    to="/profile"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                  >
                    <svg
                      className="w-4 h-4 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                  >
                    <svg
                      className="w-4 h-4 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-950 hover:text-red-300 transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile: avatar + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-green-700 flex items-center justify-center text-xs font-bold text-white">
              {user?.username?.[0]?.toUpperCase() || "U"}
            </div>
            <button
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="p-1.5 text-gray-400 hover:text-white transition-colors"
            >
              {mobileMenuOpen ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#1a1d27] border-b border-gray-800 z-30 relative">
          {/* User info */}
          <div className="px-4 py-3 border-b border-gray-800">
            <p className="text-sm font-medium text-white">{user?.username}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          {/* Nav links */}
          <div className="py-2">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center px-4 py-3 text-sm transition-colors ${
                  isActive(to)
                    ? "text-white bg-gray-800"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
          {/* Profile / Settings / Logout */}
          <div className="border-t border-gray-800 py-2">
            <Link
              to="/profile"
              className="flex items-center px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              Profile
            </Link>
            <Link
              to="/settings"
              className="flex items-center px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 text-sm text-red-400 hover:bg-red-950 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
