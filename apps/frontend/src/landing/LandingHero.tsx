import { useState } from "react";
import { Link } from "react-router-dom";
import { Zap, ArrowRight, Code2, Copy, Check } from "lucide-react";
import { useI18n } from "../context/I18nContext";

const sendExample = `curl -X POST https://your-domain.com/v1/messages/send \\
  -H "X-API-Key: wai_live_xxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "session_id": "sess_abc123",
    "to": "628123456789",
    "message": "Hello from WA Integration! 👋"
  }'`;

export default function LandingHero() {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sendExample);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const renderTitle = (title: string) => {
    if (!title.includes("WhatsApp")) return title;
    const parts = title.split("WhatsApp");
    return (
      <>
        {parts[0]}
        <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-green-400 bg-clip-text text-transparent">
          WhatsApp
        </span>
        {parts[1]}
      </>
    );
  };

  const badgeText = t("landing.badge").replace(/^[⚡\s]+/, "");

  return (
    <section className="relative max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
      {/* Background ambient glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[620px] h-[340px] bg-gradient-to-tr from-brand-600/15 via-emerald-500/10 to-teal-500/5 rounded-full blur-[110px] pointer-events-none -z-10" />
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-80 h-80 bg-brand-500/10 rounded-full blur-[90px] pointer-events-none -z-10" />

      {/* Pill Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-brand-950/70 border border-brand-800/60 rounded-full text-xs font-medium text-brand-300 mb-8 shadow-sm shadow-brand-900/20 backdrop-blur-sm">
        <Zap className="w-3.5 h-3.5 text-brand-400 shrink-0" />
        <span>{badgeText}</span>
      </div>

      {/* Title */}
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.18] tracking-tight mb-6 max-w-4xl mx-auto">
        {renderTitle(t("landing.title"))}
      </h1>

      {/* Description */}
      <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
        {t("landing.description")}
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-16">
        <Link
          to="/login"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl transition-all text-sm shadow-lg shadow-brand-900/30 hover:shadow-brand-900/50"
        >
          <span>{t("landing.start_free")}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          to="/public-docs"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900/80 hover:bg-gray-800/90 text-gray-200 border border-gray-800 hover:border-gray-700 font-medium rounded-xl transition-all text-sm backdrop-blur-sm"
        >
          <Code2 className="w-4 h-4 text-brand-400" />
          <span>{t("landing.view_docs")}</span>
        </Link>
      </div>

      {/* Interactive Code Preview */}
      <div className="max-w-2xl mx-auto text-left">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500/70" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <span className="w-3 h-3 rounded-full bg-green-500/70" />
            </div>
            <span className="text-xs text-gray-500 font-mono ml-1">terminal</span>
          </div>

          <button
            onClick={handleCopy}
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium text-gray-400 hover:text-white bg-gray-900/90 border border-gray-800 hover:border-gray-700 transition-all cursor-pointer"
            title="Copy command"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">{t("common.copied", "Copied!")}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>{t("common.copy", "Copy")}</span>
              </>
            )}
          </button>
        </div>
        <pre className="bg-gray-950/90 border border-gray-800/80 rounded-2xl p-5 text-xs text-gray-300 font-mono leading-relaxed overflow-x-auto shadow-2xl backdrop-blur-sm">
          <code>{sendExample}</code>
        </pre>
      </div>
    </section>
  );
}
