import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Zap, ArrowLeft, Check } from "lucide-react";
import { authApi } from "../../api/client";
import { useI18n } from "../../context/I18nContext";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";

const perks = [
  "Free forever — self-host with no limits",
  "All features included out of the box",
  "Baileys, Meta Cloud API, and BSP support",
  "REST API with API key authentication",
  "Auto-reply, broadcast, webhooks & more",
];

export default function Register() {
  const { t } = useI18n();
  const [name, setName] = useState("");
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
      const res = await authApi.register({ name, email, password });
      if (res.success) {
        navigate("/dashboard");
      } else {
        setError(res.message || t("status.failed", "Registration failed"));
      }
    } catch {
      setError(t("status.error", "An unexpected error occurred"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex relative">
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher compact />
      </div>

      {/* Left — Feature panel (hidden on mobile) */}
      <div className="hidden lg:flex flex-1 bg-gray-900 border-r border-gray-800 flex-col justify-center px-12 relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-brand-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative space-y-8 max-w-sm">
          <div>
            <p className="text-xs text-brand-400 font-semibold uppercase tracking-widest mb-3">
              {t("public.get_started", "Get started for free")}
            </p>
            <h2 className="text-2xl font-bold text-white leading-snug">
              {t("public.hero_title", "Start sending WhatsApp messages in minutes")}
            </h2>
            <p className="text-sm text-gray-400 mt-3 leading-relaxed">
              {t("public.hero_desc", "Self-host on your own server with full control. No credit card required, no message limits.")}
            </p>
          </div>

          <div className="space-y-3">
            {perks.map((perk) => (
              <div key={perk} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-brand-600/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-brand-400" />
                </div>
                <p className="text-xs text-gray-300">{perk}</p>
              </div>
            ))}
          </div>

          {/* Code snippet */}
          <div className="bg-gray-950 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              <span className="text-[10px] text-gray-600 font-mono ml-1">
                first message
              </span>
            </div>
            <pre className="text-[10px] text-gray-400 font-mono leading-relaxed whitespace-pre">{`curl -X POST /v1/messages/send \\
  -H "X-API-Key: wai_live_..." \\
  -d '{
    "session_id": "sess_...",
    "to": "628123456789",
    "message": "Hello! 👋"
  }'`}</pre>
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex flex-col justify-center px-8 py-12 max-w-md mx-auto w-full lg:mx-0 lg:max-w-none lg:w-[480px] lg:shrink-0">
        <div className="w-full max-w-sm mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mb-10"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> {t("public.back_to_home", "Back to home")}
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
            <h1 className="text-2xl font-bold text-white">
              {t("auth.register_desc", "Create your account")}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {t("public.hero_desc", "Free forever · No credit card required")}
            </p>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-800/50 rounded-lg px-4 py-3 mb-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">{t("auth.full_name", "Full Name")}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <label className="label">{t("auth.email", "Email Address")}</label>
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
              <label className="label">{t("auth.password", "Password")}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                minLength={6}
                required
              />
              <p className="text-[10px] text-gray-600 mt-1">
                {t("validation.min_length", "Minimum 6 characters")}
              </p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 mt-2"
            >
              {loading ? t("public.registering", "Creating account...") : t("public.register", "Create Account")}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            {t("auth.already_have_account", "Already have an account?")}{" "}
            <Link
              to="/login"
              className="text-brand-400 hover:text-brand-300 font-medium"
            >
              {t("auth.login_now", "Sign in")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
