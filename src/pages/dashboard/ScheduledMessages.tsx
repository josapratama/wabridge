import { useEffect, useState } from "react";
import {
  scheduledMessagesApi,
  sessionsApi,
  ScheduledMessage,
  Session,
} from "../../api/client";
import EmptyState from "../../components/EmptyState";
import { Clock, Plus, X, Check, RefreshCw, Ban } from "lucide-react";

export default function ScheduledMessages() {
  const [messages, setMessages] = useState<ScheduledMessage[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    sessionId: "",
    to: "",
    content: "",
    scheduledAt: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    const [m, s] = await Promise.all([
      scheduledMessagesApi.list(),
      sessionsApi.list(),
    ]);
    if (m.data)
      setMessages(
        [...m.data].sort(
          (a, b) =>
            new Date(a.scheduledAt).getTime() -
            new Date(b.scheduledAt).getTime(),
        ),
      );
    if (s.data) setSessions(s.data.filter((s) => s.status === "active"));
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await scheduledMessagesApi.create(form);
    if (res.success) {
      setShowForm(false);
      setForm({ sessionId: "", to: "", content: "", scheduledAt: "" });
      await load();
    } else {
      setError(res.message);
    }
    setSaving(false);
  };

  const handleCancel = async (id: string) => {
    await scheduledMessagesApi.cancel(id);
    await load();
  };

  const sessionName = (id: string) =>
    sessions.find((s) => s.id === id)?.name ?? id.slice(0, 8) + "…";

  const statusColor: Record<string, string> = {
    pending: "text-yellow-400",
    sent: "text-brand-400",
    failed: "text-red-400",
    cancelled: "text-gray-500",
  };

  // Min datetime = now + 1 min
  const minDatetime = new Date(Date.now() + 60_000).toISOString().slice(0, 16);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-brand-400" />
            Scheduled Messages
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Send messages at a specific time
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void load()}
            className="btn-secondary"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Schedule Message
          </button>
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">
                Schedule a Message
              </p>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {error && (
              <div className="px-3 py-2 bg-red-900/30 border border-red-800/50 rounded-lg text-xs text-red-300">
                {error}
              </div>
            )}
            <form onSubmit={(e) => void handleCreate(e)} className="space-y-3">
              <div>
                <label className="label">Session *</label>
                <select
                  className="input"
                  required
                  value={form.sessionId}
                  onChange={(e) =>
                    setForm({ ...form, sessionId: e.target.value })
                  }
                >
                  <option value="">Select active session…</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.providerType})
                    </option>
                  ))}
                </select>
                {sessions.length === 0 && (
                  <p className="text-xs text-yellow-500 mt-1">
                    No active sessions.
                  </p>
                )}
              </div>
              <div>
                <label className="label">To (phone number) *</label>
                <input
                  className="input"
                  placeholder="628123456789"
                  required
                  value={form.to}
                  onChange={(e) => setForm({ ...form, to: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Message *</label>
                <textarea
                  className="input resize-none"
                  rows={4}
                  required
                  maxLength={4096}
                  placeholder="Type your message…"
                  value={form.content}
                  onChange={(e) =>
                    setForm({ ...form, content: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">Send At *</label>
                <input
                  type="datetime-local"
                  className="input"
                  required
                  min={minDatetime}
                  value={form.scheduledAt}
                  onChange={(e) =>
                    setForm({ ...form, scheduledAt: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={saving || sessions.length === 0}
                >
                  {saving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                  {saving ? "Scheduling…" : "Schedule"}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-5 h-5 text-gray-500 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No scheduled messages"
            description="Schedule a message to be sent at a specific time."
            action={
              <button className="btn-primary" onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4" /> Schedule Message
              </button>
            }
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  Send At
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  Session
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  To
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  Message
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  Status
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {messages.map((m) => (
                <tr key={m.id} className="table-row">
                  <td className="px-5 py-3 text-xs text-gray-300 font-mono whitespace-nowrap">
                    {new Date(m.scheduledAt).toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-400">
                    {sessionName(m.sessionId)}
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-400 font-mono">
                    {m.to}
                  </td>
                  <td className="px-5 py-3 text-gray-200 text-xs max-w-[200px] truncate">
                    {m.content}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs font-medium ${statusColor[m.status] ?? "text-gray-400"}`}
                    >
                      ● {m.status}
                    </span>
                    {m.errorMessage && (
                      <p className="text-[10px] text-red-400/70 mt-0.5 truncate max-w-[120px]">
                        {m.errorMessage}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {m.status === "pending" && (
                      <button
                        onClick={() => void handleCancel(m.id)}
                        className="btn-danger text-xs"
                      >
                        <Ban className="w-3.5 h-3.5" /> Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
