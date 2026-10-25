import { useEffect, useState } from "react";
import {
  sessionHealthApi,
  sessionsApi,
  SessionHealthLog,
  Session,
} from "../../api/client";
import { Activity, RefreshCw, Wifi, WifiOff, Loader2 } from "lucide-react";

const statusColor: Record<string, string> = {
  connected: "text-brand-400",
  disconnected: "text-red-400",
  reconnecting: "text-yellow-400",
};

const statusIcon = (status: string) => {
  if (status === "connected")
    return <Wifi className="w-4 h-4 text-brand-400" />;
  if (status === "reconnecting")
    return <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />;
  return <WifiOff className="w-4 h-4 text-red-400" />;
};

export default function SessionHealth() {
  const [health, setHealth] = useState<SessionHealthLog[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [h, s] = await Promise.all([
      sessionHealthApi.all(),
      sessionsApi.list(),
    ]);
    if (h.data) setHealth(h.data);
    if (s.data) setSessions(s.data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(), 30_000);
    return () => clearInterval(interval);
  }, []);

  // Merge sessions with health data
  const rows = sessions.map((s) => ({
    session: s,
    log: health.find((h) => h.sessionId === s.id) ?? null,
  }));

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-gray-400">
          Real-time connection status · auto-refreshes every 30s
        </p>
        <button
          onClick={() => void load()}
          className="btn-secondary self-start sm:self-auto"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {loading && sessions.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-5 h-5 text-gray-500 animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-gray-500">
            No sessions found. Create a session first.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map(({ session, log }) => (
            <div key={session.id} className="card p-5 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">
                    {session.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {session.providerType}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {log ? (
                    statusIcon(log.status)
                  ) : (
                    <WifiOff className="w-4 h-4 text-gray-600" />
                  )}
                  <span
                    className={`text-xs font-medium ${log ? statusColor[log.status] : "text-gray-600"}`}
                  >
                    {log?.status ?? "unknown"}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-800/50 rounded-lg px-3 py-2">
                  <p className="text-[10px] text-gray-500">Sent today</p>
                  <p className="text-lg font-bold text-white">
                    {log?.messagesSentToday ?? 0}
                  </p>
                </div>
                <div className="bg-gray-800/50 rounded-lg px-3 py-2">
                  <p className="text-[10px] text-gray-500">Received today</p>
                  <p className="text-lg font-bold text-white">
                    {log?.messagesReceivedToday ?? 0}
                  </p>
                </div>
              </div>

              {/* Latency + last check */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  {log?.latencyMs != null
                    ? `${log.latencyMs}ms latency`
                    : "No latency data"}
                </span>
                <span>
                  {log
                    ? `Checked ${new Date(log.checkedAt).toLocaleTimeString()}`
                    : "Never checked"}
                </span>
              </div>

              {/* Session status badge */}
              <div
                className={`text-[10px] px-2 py-1 rounded text-center font-medium ${
                  session.status === "active"
                    ? "bg-brand-900/30 text-brand-400 border border-brand-800/40"
                    : "bg-gray-800 text-gray-500 border border-gray-700"
                }`}
              >
                Session: {session.status}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
