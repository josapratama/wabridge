import { Link } from "react-router-dom";
import { Zap, ArrowRight, Code2 } from "lucide-react";
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

  return (
    <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-900/40 border border-brand-800/50 rounded-full text-xs text-brand-400 mb-8">
        <Zap className="w-3 h-3" />
        {t("landing.badge")}
      </div>

      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
        {t("landing.title")}
      </h1>

      <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
        {t("landing.description")}
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl transition-colors text-sm"
        >
          {t("landing.start_free")} <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          to="/public-docs"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium rounded-xl transition-colors text-sm"
        >
          <Code2 className="w-4 h-4" /> {t("landing.view_docs")}
        </Link>
      </div>

      {/* Code preview */}
      <div className="max-w-2xl mx-auto text-left">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/60" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <span className="w-3 h-3 rounded-full bg-green-500/60" />
          </div>
          <span className="text-xs text-gray-600 font-mono">terminal</span>
        </div>
        <pre className="bg-gray-950 border border-gray-800 rounded-xl p-5 text-xs text-gray-300 font-mono leading-relaxed overflow-x-auto whitespace-pre">
          <code>{sendExample}</code>
        </pre>
      </div>
    </section>
  );
}
