import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Zap,
  ArrowLeft,
  MessageSquare,
  Radio,
  Bot,
  Webhook,
} from "lucide-react";
import { authApi } from "../../api/client";

const features = [
  { icon: MessageSquare, text: "Send text, image, video, document & location" },
  { icon: Radio, text: "Broadcast to 1000+ contacts with delay" },
  { icon: Bot, text: "Auto-reply rules with regex support" },
  { icon: Webhook, text: "Real-time webhooks to your server" },
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      if (res.success && res.data) {
        localStorage.setItem("token", res.data.access_token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        navigate("/dashboard");
      } else {
        setError(res.message || "Login failed");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Left — Form */}
      <div className="flex-1 flex flex-col justify-center px-8 py-12 max-w-md mx-auto w-full lg:mx-0 lg:max-w-none lg:w-[480px] lg:shrink-0">
        <div className="w-full max-w-sm mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mb-10"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to home
          </Link>

          <div className="mb-8">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center">
                <Zap className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="text-sm font-bold text-white">
                WA Integration
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white">Welcome back</h1>
            <p className="text-sm text-gray-500 mt-1">
              Sign in to your dashboard
            </p>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-800/50 rounded-lg px-4 py-3 mb-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 mt-2"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-brand-400 hover:text-brand-300 font-medium"
            >
              Register now
            </Link>
          </p>
        </div>
      </div>

      {/* Right — Feature panel (hidden on mobile) */}
      <div className="hidden lg:flex flex-1 bg-gray-900 border-l border-gray-800 flex-col justify-center px-12 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-brand-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative space-y-8 max-w-sm">
          <div>
            <p className="text-xs text-brand-400 font-semibold uppercase tracking-widest mb-3">
              WhatsApp API Platform
            </p>
            <h2 className="text-2xl font-bold text-white leading-snug">
              Everything you need to automate WhatsApp
            </h2>
            <p className="text-sm text-gray-400 mt-3 leading-relaxed">
              Connect any WhatsApp number, send any message type, and automate
              replies — all through a simple REST API.
            </p>
          </div>

          <div className="space-y-3">
            {features.map((f) => (
              <div key={f.text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-600/15 border border-brand-800/40 flex items-center justify-center shrink-0">
                  <f.icon className="w-3.5 h-3.5 text-brand-400" />
                </div>
                <p className="text-xs text-gray-300">{f.text}</p>
              </div>
            ))}
          </div>

          <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl space-y-2">
            <p className="text-xs text-gray-300 leading-relaxed italic">
              "WA Integration made it trivial to add WhatsApp notifications to
              our app. The API is clean and the dashboard is intuitive."
            </p>
            <div className="flex items-center gap-2 pt-1">
              <div className="w-6 h-6 rounded-full bg-brand-600/30 flex items-center justify-center text-[10px] font-bold text-brand-400">
                A
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-200">
                  A Developer
                </p>
                <p className="text-[10px] text-gray-500">Self-hosted user</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
