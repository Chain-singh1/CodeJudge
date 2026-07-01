import { useState } from "react";
import Navbar from "../components/Navbar";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";

const inputCls =
  "w-full bg-[#0f1117] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors";

const Settings = () => {
  const { user, login, token } = useAuth();

  const [username, setUsername] = useState(user?.username || "");
  const [currentPassword, setCurrentPass] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPass] = useState("");

  const [usernameLoading, setUsernameLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [usernameMsg, setUsernameMsg] = useState(null); // { type: 'success'|'error', text }
  const [passwordMsg, setPasswordMsg] = useState(null);

  const handleUsernameUpdate = async (e) => {
    e.preventDefault();
    if (username === user?.username)
      return setUsernameMsg({
        type: "error",
        text: "Username is the same as current",
      });

    setUsernameLoading(true);
    setUsernameMsg(null);
    try {
      const { data } = await API.put("/auth/settings", { username });
      // Update auth context with new username
      login(data.user, token);
      setUsernameMsg({
        type: "success",
        text: "Username updated successfully",
      });
    } catch (err) {
      setUsernameMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to update",
      });
    } finally {
      setUsernameLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword)
      return setPasswordMsg({
        type: "error",
        text: "New passwords do not match",
      });
    if (newPassword.length < 6)
      return setPasswordMsg({
        type: "error",
        text: "Password must be at least 6 characters",
      });

    setPasswordLoading(true);
    setPasswordMsg(null);
    try {
      await API.put("/auth/settings", { currentPassword, newPassword });
      setPasswordMsg({
        type: "success",
        text: "Password updated successfully",
      });
      setCurrentPass("");
      setNewPassword("");
      setConfirmPass("");
    } catch (err) {
      setPasswordMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to update",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const Feedback = ({ msg }) => {
    if (!msg) return null;
    return (
      <p
        className={`text-sm mt-2 ${msg.type === "success" ? "text-green-400" : "text-red-400"}`}
      >
        {msg.type === "success" ? "✓ " : "✗ "}
        {msg.text}
      </p>
    );
  };

  return (
    <div className="min-h-screen w-full bg-[#0f1117] text-white">
      <Navbar />

      <div className="max-w-xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-gray-400 text-sm mt-1">Manage your account</p>
        </div>

        {/* Account info read-only */}
        <div className="bg-[#1a1d27] border border-gray-800 rounded-2xl p-5 mb-6">
          <h2 className="text-sm font-medium text-gray-300 mb-4">
            Account Info
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Email</span>
              <span className="text-sm text-white">{user?.email}</span>
            </div>
            {/* <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Role</span>
              <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${
                user?.role === 'admin' ? 'text-purple-400 bg-purple-950' : 'text-gray-400 bg-gray-800'
              }`}>
                {user?.role}
              </span>
            </div> */}
          </div>
        </div>

        {/* Change username */}
        <div className="bg-[#1a1d27] border border-gray-800 rounded-2xl p-5 mb-6">
          <h2 className="text-sm font-medium text-gray-300 mb-4">
            Change Username
          </h2>
          <form onSubmit={handleUsernameUpdate} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">
                New username
              </label>
              <input
                className={inputCls}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                minLength={3}
                required
                placeholder="Enter new username"
              />
            </div>
            <Feedback msg={usernameMsg} />
            <button
              type="submit"
              disabled={usernameLoading}
              className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 rounded-xl transition-colors"
            >
              {usernameLoading ? "Saving..." : "Update Username"}
            </button>
          </form>
        </div>

        {/* Change password */}
        <div className="bg-[#1a1d27] border border-gray-800 rounded-2xl p-5">
          <h2 className="text-sm font-medium text-gray-300 mb-4">
            Change Password
          </h2>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">
                Current password
              </label>
              <input
                type="password"
                className={inputCls}
                value={currentPassword}
                onChange={(e) => setCurrentPass(e.target.value)}
                required
                placeholder="Enter current password"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">
                New password
              </label>
              <input
                type="password"
                className={inputCls}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Min. 6 characters"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">
                Confirm new password
              </label>
              <input
                type="password"
                className={inputCls}
                value={confirmPassword}
                onChange={(e) => setConfirmPass(e.target.value)}
                required
                placeholder="Repeat new password"
              />
            </div>
            <Feedback msg={passwordMsg} />
            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 rounded-xl transition-colors"
            >
              {passwordLoading ? "Saving..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;