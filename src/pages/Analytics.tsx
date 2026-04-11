import { useEffect, useState } from "react";
import { analyticsApi, AnalyticsSummary, UsageRecord } from "../api/client";
import { BarChart2, TrendingUp, RefreshCw, AlertCircle } from "lucide-react";

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
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [usage, setUsage] = useState<UsageRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [s, u] = await Promise.all([
      analyticsApi.summary(),
      analyticsApi.usage(),
    ]);
    if (s.data) setSummary(s.data);
    if (u.data) setUsage(u.data);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-brand-400" />
            Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Message statistics and usage
          </p>
        </div>
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
              label="Total Sent"
              value={summary?.totalSent ?? 0}
              color="text-brand-400"
              sub="outbound messages"
            />
            <StatCard
              label="Total Received"
              value={summary?.totalReceived ?? 0}
              color="text-blue-400"
              sub="inbound messages"
            />
            <StatCard
              label="Success Rate"
              value={`${summary?.successRate ?? 100}%`}
              color="text-green-400"
              sub="sent successfully"
            />
            <StatCard
              label="Monthly Quota"
              value={`${usage?.messagesSent ?? 0} / ${usage?.quotaLimit ?? 1000}`}
              color={usagePct > 80 ? "text-red-400" : "text-yellow-400"}
              sub={`${usagePct}% used this month`}
            />
          </div>

          {/* Quota bar */}
          {usage && (
            <div className="card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-200">
                  Monthly Usage — {usage.month}
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
              Last 7 Days
            </h2>
            <div className="space-y-3">
              {summary?.dailyStats.map((day) => (
                <div key={day.date} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 w-20 shrink-0">
                      {new Date(day.date).toLocaleDateString("en", {
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
                <span className="w-2.5 h-2.5 rounded-full bg-brand-500" /> Sent
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />{" "}
                Received
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Failed
              </div>
            </div>
          </div>

          {/* Status breakdown */}
          {summary && Object.keys(summary.statusBreakdown).length > 0 && (
            <div className="card p-5 space-y-3">
              <h2 className="text-sm font-semibold text-white">
                Status Breakdown
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
