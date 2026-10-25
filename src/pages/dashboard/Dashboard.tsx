import { useEffect, useState } from "react";
import {
  healthApi,
  HealthResult,
  sessionsApi,
  Session,
  messagesApi,
  Message,
  eventsApi,
  ProviderEvent,
} from "../../api/client";
import {
  Activity,
  Layers,
  MessageSquare,
  Wifi,
  WifiOff,
  RefreshCw,
} from "lucide-react";
import StatusBadge from "../../components/StatusBadge";

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
    <div className="card p-5 flex items-center gap-4">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [health, setHealth] = useState<HealthResult | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [events, setEvents] = useState<ProviderEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [h, s, m, e] = await Promise.allSettled([
      healthApi.check(),
      sessionsApi.list(),
      messagesApi.list(),
      eventsApi.list(),
    ]);
    if (h.status === "fulfilled" && h.value.data) setHealth(h.value.data);
    if (s.status === "fulfilled" && s.value.data) setSessions(s.value.data);
    if (m.status === "fulfilled" && m.value.data) setMessages(m.value.data);
    if (e.status === "fulfilled" && e.value.data) setEvents(e.value.data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const activeSessions = sessions.filter((s) => s.status === "active").length;
  const failedMessages = messages.filter((m) => m.status === "failed").length;

  return (
    <div className="p-6 space-y-6">
      {/* Subtitle / Action Bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          Overview and real-time status of your WhatsApp integration
        </p>
        <button
          onClick={() => void load()}
          className="btn-secondary"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Health Banner */}
      {health && (
        <div
          className={`card p-4 flex items-center gap-3 ${
            health.status === "ok"
              ? "border-brand-800/50"
              : "border-yellow-800/50"
          }`}
        >
          {health.status === "ok" ? (
            <Wifi className="w-5 h-5 text-brand-400 shrink-0" />
          ) : (
            <WifiOff className="w-5 h-5 text-yellow-400 shrink-0" />
          )}
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-200">
              System status: <StatusBadge value={health.status} />
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Uptime {Math.floor(health.uptime)}s
            </p>
          </div>
          <div className="flex gap-3">
            {health.providers.map((p) => (
              <div key={p.providerType} className="text-right">
                <p className="text-xs font-medium text-gray-300">
                  {p.providerType}
                </p>
                <p
                  className={`text-xs ${p.healthy ? "text-brand-400" : "text-red-400"}`}
                >
                  {p.healthy ? "● online" : "● offline"}
                  {p.latencyMs != null && ` · ${p.latencyMs}ms`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Sessions"
          value={sessions.length}
          icon={Layers}
          color="bg-blue-500/15 text-blue-400"
        />
        <StatCard
          label="Active Sessions"
          value={activeSessions}
          icon={Layers}
          color="bg-brand-500/15 text-brand-400"
        />
        <StatCard
          label="Total Messages"
          value={messages.length}
          icon={MessageSquare}
          color="bg-purple-500/15 text-purple-400"
        />
        <StatCard
          label="Failed Messages"
          value={failedMessages}
          icon={Activity}
          color="bg-red-500/15 text-red-400"
        />
      </div>

      {/* Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Messages */}
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-200">
              Recent Messages
            </h2>
            <span className="text-xs text-gray-500">
              {messages.length} total
            </span>
          </div>
          <div className="divide-y divide-gray-800">
            {messages
              .slice(-5)
              .reverse()
              .map((m) => (
                <div key={m.id} className="px-5 py-3 flex items-center gap-3">
                  <StatusBadge value={m.direction} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 truncate">
                      {m.content}
                    </p>
                    <p className="text-xs text-gray-500">{m.to}</p>
                  </div>
                  <StatusBadge value={m.status} />
                </div>
              ))}
            {messages.length === 0 && (
              <p className="px-5 py-8 text-sm text-gray-600 text-center">
                No messages yet
              </p>
            )}
          </div>
        </div>

        {/* Recent Events */}
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-200">
              Recent Events
            </h2>
            <span className="text-xs text-gray-500">{events.length} total</span>
          </div>
          <div className="divide-y divide-gray-800">
            {events
              .slice(-5)
              .reverse()
              .map((e) => (
                <div key={e.id} className="px-5 py-3 flex items-center gap-3">
                  <StatusBadge value={e.providerType} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 font-mono truncate">
                      {e.eventType}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(e.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${e.processed ? "bg-brand-500" : "bg-yellow-500"}`}
                  />
                </div>
              ))}
            {events.length === 0 && (
              <p className="px-5 py-8 text-sm text-gray-600 text-center">
                No events yet
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
