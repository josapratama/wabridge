import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  healthApi,
  HealthResult,
  sessionsApi,
  Session,
  messagesApi,
  Message,
  eventsApi,
  ProviderEvent,
  aiBotApi,
} from "../../api/client";
import {
  Activity,
  Layers,
  MessageSquare,
  Wifi,
  WifiOff,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Bot,
} from "lucide-react";
import StatusBadge from "../../components/StatusBadge";
import { useI18n } from "../../context/I18nContext";

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="p-3.5 sm:p-5 rounded-2xl bg-gradient-to-br from-gray-900/90 to-gray-950 border border-gray-800/80 shadow-sm hover:border-gray-700/80 transition-all flex items-center gap-3 sm:gap-4">
      <div
        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}
      >
        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-none">
          {value}
        </p>
        <p className="text-[11px] sm:text-xs text-gray-400 truncate mt-1 font-medium">
          {label}
        </p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { t } = useI18n();
  const [health, setHealth] = useState<HealthResult | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [events, setEvents] = useState<ProviderEvent[]>([]);
  const [aiStats, setAiStats] = useState<{
    totalReplies: number;
    lastReplyAt: string | null;
    isEnabled: boolean;
    provider: string;
    model: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [h, s, m, e, ai] = await Promise.allSettled([
      healthApi.check(),
      sessionsApi.list(),
      messagesApi.list(),
      eventsApi.list(),
      aiBotApi.getStats(),
    ]);
    if (h.status === "fulfilled" && h.value.data) setHealth(h.value.data);
    if (s.status === "fulfilled" && s.value.data) setSessions(s.value.data);
    if (m.status === "fulfilled" && m.value.data) setMessages(m.value.data);
    if (e.status === "fulfilled" && e.value.data) setEvents(e.value.data);
    if (ai.status === "fulfilled" && ai.value.data) setAiStats(ai.value.data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const activeSessions = sessions.filter((s) => s.status === "active").length;
  const failedMessages = messages.filter((m) => m.status === "failed").length;

  return (
    <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6">
      {/* Subtitle / Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <p className="text-xs sm:text-sm text-gray-400">
          {t("dashboard.subtitle", "Ringkasan metrik performa, status koneksi gateway, dan aktivitas real-time")}
        </p>
        <button
          onClick={() => void load()}
          className="btn-secondary self-start sm:self-auto text-xs sm:text-sm"
          disabled={loading}
        >
          <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${loading ? "animate-spin" : ""}`} />
          {t("actions.refresh", "Segarkan")}
        </button>
      </div>

      {/* Health / Gateway Banner */}
      {health && (
        <div
          className={`p-4 sm:p-5 rounded-2xl border transition-all ${
            health.status === "ok"
              ? "border-brand-800/40 bg-gradient-to-br from-brand-950/20 via-gray-900 to-gray-900"
              : "border-yellow-800/40 bg-gradient-to-br from-yellow-950/20 via-gray-900 to-gray-900"
          }`}
        >
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-800/80">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  health.status === "ok"
                    ? "bg-brand-500/15 text-brand-400 ring-1 ring-brand-500/30"
                    : "bg-yellow-500/15 text-yellow-400 ring-1 ring-yellow-500/30"
                }`}
              >
                {health.status === "ok" ? (
                  <Wifi className="w-4 h-4" />
                ) : (
                  <WifiOff className="w-4 h-4" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-200">
                    {t("dashboard.system_status", "Status Gateway")}
                  </span>
                  <StatusBadge value={health.status} />
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {t("dashboard.uptime", { seconds: Math.floor(health.uptime) })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-gray-500">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
              <span>Engine: <span className="text-gray-300 font-mono">v1.2.0</span></span>
            </div>
          </div>

          {/* Providers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3">
            {health.providers.map((p) => (
              <div
                key={p.providerType}
                className="flex items-center justify-between p-2.5 rounded-xl bg-gray-950/50 border border-gray-800/60"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      p.healthy ? "bg-brand-500 animate-pulse" : "bg-red-500"
                    }`}
                  />
                  <span className="text-xs font-semibold text-gray-200 capitalize truncate">
                    {p.providerType}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`text-[11px] font-medium ${
                      p.healthy ? "text-brand-400" : "text-red-400"
                    }`}
                  >
                    {p.healthy ? t("status.online", "Online") : t("status.offline", "Offline")}
                  </span>
                  {p.latencyMs != null && (
                    <span className="text-[10px] text-gray-400 bg-gray-900 px-1.5 py-0.5 rounded border border-gray-800 font-mono">
                      {p.latencyMs}ms
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Assistant Performance Banner */}
      <div className="p-4 sm:p-5 rounded-2xl border border-purple-800/40 bg-gradient-to-br from-purple-950/20 via-gray-900 to-gray-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-purple-500/15 text-purple-400 ring-1 ring-purple-500/30 flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-semibold text-white">
                {t("dashboard.ai_assistant_title", "AI Assistant WhatsApp")}
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  aiStats?.isEnabled
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-gray-800 text-gray-400 border border-gray-700"
                }`}
              >
                {aiStats?.isEnabled
                  ? t("status.active", "Aktif")
                  : t("status.inactive", "Nonaktif")}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5 flex flex-wrap items-center gap-2">
              <span>
                {t("autoreply.provider", "Provider")}:{" "}
                <strong className="text-gray-300 capitalize">{aiStats?.provider || "Gemini"}</strong>
              </span>
              <span>•</span>
              <span>
                Model: <span className="font-mono text-purple-300">{aiStats?.model || "gemini-2.0-flash"}</span>
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-gray-800 pt-2.5 sm:pt-0">
          <div className="text-left sm:text-right">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
              {t("dashboard.ai_total_replies", "Total Balasan AI")}
            </p>
            <p className="text-lg sm:text-xl font-bold text-white font-mono">
              {aiStats?.totalReplies ?? 0}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
              {t("dashboard.ai_last_active", "Terakhir Aktif")}
            </p>
            <p className="text-xs text-gray-300">
              {aiStats?.lastReplyAt
                ? new Date(aiStats.lastReplyAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : t("common.never", "Belum ada")}
            </p>
          </div>
          <Link
            to="/auto-reply"
            className="btn-secondary text-xs flex items-center gap-1.5 shrink-0 px-3 py-1.5"
          >
            <span>{t("common.settings", "Pengaturan")}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Stats 2x2 on mobile, 4-col on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label={t("dashboard.total_sessions", "Total Sesi")}
          value={sessions.length}
          icon={Layers}
          color="bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30"
        />
        <StatCard
          label={t("dashboard.active_sessions", "Sesi Aktif")}
          value={activeSessions}
          icon={Layers}
          color="bg-brand-500/15 text-brand-400 ring-1 ring-brand-500/30"
        />
        <StatCard
          label={t("dashboard.total_messages", "Total Pesan")}
          value={messages.length}
          icon={MessageSquare}
          color="bg-purple-500/15 text-purple-400 ring-1 ring-purple-500/30"
        />
        <StatCard
          label={t("dashboard.failed_messages", "Pesan Gagal")}
          value={failedMessages}
          icon={Activity}
          color="bg-red-500/15 text-red-400 ring-1 ring-red-500/30"
        />
      </div>

      {/* Recent Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Messages */}
        <div className="card overflow-hidden">
          <div className="px-4 sm:px-5 py-3.5 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-semibold text-gray-200">
              {t("dashboard.recent_messages", "Pesan Terbaru")}
            </h2>
            <Link
              to="/messages"
              className="text-[11px] text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1 transition-colors"
            >
              <span>{t("common.view_all", "Lihat Semua")}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-800">
            {messages
              .slice(-5)
              .reverse()
              .map((m) => (
                <div key={m.id} className="px-4 sm:px-5 py-3 flex items-center gap-3">
                  <StatusBadge value={m.direction} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-200 truncate">
                      {m.content}
                    </p>
                    <p className="text-[11px] text-gray-500">{m.to}</p>
                  </div>
                  <StatusBadge value={m.status} />
                </div>
              ))}
            {messages.length === 0 && (
              <div className="py-10 px-4 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-3 shadow-inner">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <p className="text-xs font-medium text-gray-300">
                  {t("dashboard.no_messages", "Belum ada riwayat pesan")}
                </p>
                <p className="text-[11px] text-gray-500 max-w-xs mt-1">
                  Kirim pesan teks atau media pertama Anda melalui sesi aktif.
                </p>
                <Link
                  to="/messages"
                  className="mt-3 text-xs inline-flex items-center gap-1 text-brand-400 hover:text-brand-300 font-medium transition-colors"
                >
                  <span>+ {t("messages.new_message", "Kirim Pesan Baru")}</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Events */}
        <div className="card overflow-hidden">
          <div className="px-4 sm:px-5 py-3.5 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-semibold text-gray-200">
              {t("dashboard.recent_events", "Log Aktivitas Terbaru")}
            </h2>
            <Link
              to="/events"
              className="text-[11px] text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors"
            >
              <span>{t("common.view_all", "Lihat Semua")}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-800">
            {events
              .slice(-5)
              .reverse()
              .map((e) => (
                <div key={e.id} className="px-4 sm:px-5 py-3 flex items-center gap-3">
                  <StatusBadge value={e.providerType} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-200 font-mono truncate">
                      {e.eventType}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {new Date(e.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${e.processed ? "bg-brand-500" : "bg-yellow-500"}`}
                  />
                </div>
              ))}
            {events.length === 0 && (
              <div className="py-10 px-4 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3 shadow-inner">
                  <Activity className="w-6 h-6" />
                </div>
                <p className="text-xs font-medium text-gray-300">
                  {t("dashboard.no_events", "Belum ada aktivitas tercatat")}
                </p>
                <p className="text-[11px] text-gray-500 max-w-xs mt-1">
                  Event gateway dan webhook real-time akan muncul di sini.
                </p>
                <Link
                  to="/events"
                  className="mt-3 text-xs inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  <span>Buka Log Event →</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
