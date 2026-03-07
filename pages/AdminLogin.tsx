import React, { useState } from "react";
import { ShieldCheck, Lock, Mail, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../src/services/api";
import { useGlobal } from "../App";

const ADMIN_PORTAL_PATH = "/portal/hf-admin-7x93";
const ADMIN_SESSION_STARTED_AT_KEY = "admin_session_started_at";
const ADMIN_LAST_ACTIVITY_AT_KEY = "admin_last_activity_at";

const AdminLogin: React.FC = () => {
  const { login } = useGlobal();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Enter both admin email and password.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/auth/admin/login", { email, password });
      const { token, user } = res.data;
      const now = Date.now();

      localStorage.setItem("token", token);
      localStorage.setItem(ADMIN_SESSION_STARTED_AT_KEY, String(now));
      localStorage.setItem(ADMIN_LAST_ACTIVITY_AT_KEY, String(now));

      login({
        id: user?._id || user?.id || user?.email,
        name: user?.name,
        email: user?.email,
        role: user?.role,
        phone: user?.phone,
        addresses: user?.addresses || []
      });

      navigate(ADMIN_PORTAL_PATH, { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || "Admin login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-sky-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-8 space-y-8">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-sky-600 text-white flex items-center justify-center mx-auto">
            <ShieldCheck size={26} />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Admin Portal Access</h1>
          <p className="text-sm text-gray-500 font-medium">
            OTP is temporarily disabled for testing.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
              Admin Email
            </label>
            <div className="relative">
              <Mail
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:border-sky-500 focus:bg-white outline-none"
                placeholder="admin@healthfirst.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
              Password
            </label>
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:border-sky-500 focus:bg-white outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">
              {error}
            </div>
          )}

          <button
            disabled={loading}
            className="w-full py-3 rounded-xl bg-sky-600 text-white font-black flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60"
          >
            <span>{loading ? "Signing in..." : "Enter Admin Portal"}</span>
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
