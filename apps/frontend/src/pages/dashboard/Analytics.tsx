import { useEffect, useState } from "react";
import { analyticsApi, AnalyticsSummary, UsageRecord, aiBotApi } from "../../api/client";
import { BarChart2, TrendingUp, RefreshCw, AlertCircle, Bot } from "lucide-react";
import { useI18n } from "../../context/I18nContext";

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="card p-5">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
    </div>
  );
}

function MiniBar({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 w-6 text-right">{value}</span>
    </div>
  );
}

export default function Analytics() {
  const { t } = useI18n();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [usage, setUsage] = useState<UsageRecord | null>(null);
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
    const [s, u, ai] = await Promise.allSettled([
      analyticsApi.summary(),
      analyticsApi.usage(),
      aiBotApi.getStats(),
    ]);
    if (s.status === "fulfilled" && s.value.data) setSummary(s.value.data);
    if (u.status === "fulfilled" && u.value.data) setUsage(u.value.data);
    if (ai.status === "fulfilled" && ai.value.data) setAiStats(ai.value.data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const maxDaily = summary
    ? Math.max(...summary.dailyStats.map((d) => d.sent + d.received), 1)
    : 1;
  const usagePct = usage
    ? Math.round((usage.messagesSent / usage.quotaLimit) * 100)
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-gray-400">
          {t("analytics.subtitle")}
        </p>
        <button
          onClick={() => void load()}
          className="btn-secondary"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-5 h-5 text-gray-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label={t("analytics.total_messages")}
              value={summary?.totalSent ?? 0}
              color="text-brand-400"
              sub={t("messages.sent_tab", "outbound messages")}
            />
            <StatCard
              label={t("messages.received_tab", "Total Received")}
              value={summary?.totalReceived ?? 0}
              color="text-blue-400"
              sub={t("messages.received_tab", "inbound messages")}
            />
            <StatCard
              label={t("analytics.success_rate")}
              value={`${summary?.successRate ?? 100}%`}
              color="text-green-400"
              sub={t("analytics.delivered", "sent successfully")}
            />
            <StatCard
              label={t("analytics.monthly_usage")}
              value={`${usage?.messagesSent ?? 0} / ${usage?.quotaLimit ?? 1000}`}
              color={usagePct > 80 ? "text-red-400" : "text-yellow-400"}
              sub={`${usagePct}% used this month`}
            />
          </div>

          {/* AI Assistant Performance Metrics */}
          <div className="card p-5 border border-purple-800/40 bg-gradient-to-br from-purple-950/20 via-gray-900 to-gray-900 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">
                      {t("analytics.ai_performance", "Performa Asisten AI")}
                    </h3>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        aiStats?.isEnabled
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-gray-800 text-gray-400 border border-gray-700"
                      }`}
                    >
                      {aiStats?.isEnabled ? "Online / Aktif" : "Nonaktif"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Provider: <strong className="text-gray-300 capitalize">{aiStats?.provider || "Gemini"}</strong> • Model:{" "}
                    <span className="font-mono text-purple-300">{aiStats?.model || "gemini-2.0-flash"}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <p className="text-gray-400 text-[11px] font-medium">Balasan AI Terkirim</p>
                  <p className="text-lg font-bold text-white font-mono">{aiStats?.totalReplies ?? 0}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-[11px] font-medium">Rasio Otomasi AI</p>
                  <p className="text-lg font-bold text-purple-400 font-mono">
                    {summary?.totalReceived && summary.totalReceived > 0
                      ? `${Math.min(100, Math.round(((aiStats?.totalReplies || 0) / summary.totalReceived) * 100))}%`
                      : (aiStats?.totalReplies ?? 0) > 0 ? "100%" : "0%"}
                  </p>
                </div>
              </div>
            </div>

            {/* AI vs Human volume bar */}
            <div>
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                <span>Distribusi Penanganan Pesan</span>
                <span className="text-purple-300 font-medium">
                  {aiStats?.totalReplies ?? 0} Bot / {Math.max(0, (summary?.totalSent ?? 0) - (aiStats?.totalReplies ?? 0))} Human CS
                </span>
              </div>
              <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden flex">
                <div
                  className="bg-purple-500 h-full transition-all"
                  style={{
                    width: `${
                      (summary?.totalSent ?? 0) > 0
                        ? Math.min(100, Math.round(((aiStats?.totalReplies ?? 0) / (summary?.totalSent || 1)) * 100))
                        : (aiStats?.totalReplies ?? 0) > 0 ? 100 : 0
                    }%`,
                  }}
                  title="Balasan Bot AI"
                />
                <div
                  className="bg-brand-500 h-full transition-all"
                  style={{
                    width: `${
                      (summary?.totalSent ?? 0) > 0
                        ? Math.max(0, 100 - Math.min(100, Math.round(((aiStats?.totalReplies ?? 0) / (summary?.totalSent || 1)) * 100)))
                        : 0
                    }%`,
                  }}
                  title="Balasan CS Manusia"
                />
              </div>
              <div className="flex items-center gap-4 text-[10px] text-gray-500 mt-1.5">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  <span>Dijawab Otomatis oleh AI</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-brand-500" />
                  <span>Ditangani Manual oleh Staf CS</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quota bar */}
          {usage && (
            <div className="card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-200">
                  {t("analytics.monthly_usage")} — {usage.month}
                </p>
                <span
                  className={`text-xs font-medium ${usagePct > 80 ? "text-red-400" : "text-gray-400"}`}
                >
                  {usagePct}%
                </span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${usagePct > 80 ? "bg-red-500" : usagePct > 60 ? "bg-yellow-500" : "bg-brand-500"}`}
                  style={{ width: `${Math.min(usagePct, 100)}%` }}
                />
              </div>
              {usagePct > 80 && (
                <div className="flex items-center gap-2 text-xs text-red-400">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Approaching quota limit.{" "}
                  {usage.quotaLimit - usage.messagesSent} messages remaining.
                </div>
              )}
            </div>
          )}

          {/* Daily chart */}
          <div className="card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-400" />
              {t("time.last_7_days", "Last 7 Days")}
            </h2>
            <div className="space-y-3">
              {summary?.dailyStats.map((day) => (
                <div key={day.date} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 w-20 shrink-0">
                      {new Date(day.date).toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <div className="flex-1 space-y-1 ml-3">
                      <MiniBar
                        value={day.sent}
                        max={maxDaily}
                        color="bg-brand-500"
                      />
                      <MiniBar
                        value={day.received}
                        max={maxDaily}
                        color="bg-blue-500"
                      />
                      {day.failed > 0 && (
                        <MiniBar
                          value={day.failed}
                          max={maxDaily}
                          color="bg-red-500"
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 pt-1">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-500" /> {t("messages.sent_tab", "Sent")}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />{" "}
                {t("messages.received_tab", "Received")}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> {t("analytics.failed", "Failed")}
              </div>
            </div>
          </div>

          {/* Status breakdown */}
          {summary && Object.keys(summary.statusBreakdown).length > 0 && (
            <div className="card p-5 space-y-3">
              <h2 className="text-sm font-semibold text-white">
                {t("analytics.providers_breakdown", "Status Breakdown")}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(summary.statusBreakdown).map(
                  ([status, count]) => (
                    <div
                      key={status}
                      className="bg-gray-800/50 rounded-lg px-3 py-2"
                    >
                      <p className="text-xs text-gray-500 capitalize">
                        {status}
                      </p>
                      <p className="text-lg font-bold text-white">{count}</p>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
