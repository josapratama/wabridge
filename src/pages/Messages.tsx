import { useEffect, useState } from "react";
import { messagesApi, Message, sessionsApi, Session } from "../api/client";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";
import {
  MessageSquare,
  Send,
  X,
  RefreshCw,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";

export default function Messages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ sessionId: "", to: "", message: "" });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    setLoading(true);
    const [m, s] = await Promise.all([messagesApi.list(), sessionsApi.list()]);
    if (m.data) setMessages([...m.data].reverse());
    if (s.data) setSessions(s.data.filter((s) => s.status === "active"));
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError("");
    setSuccess("");
    const res = await messagesApi.send(form);
    if (res.success) {
      setSuccess("Message sent successfully!");
      setForm({ ...form, message: "" });
      await load();
      setTimeout(() => setSuccess(""), 3000);
    } else {
      setError(res.message);
    }
    setSending(false);
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Messages</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Send and view message history
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
            <Send className="w-4 h-4" /> Send Message
          </button>
        </div>
      </div>

      {/* Send Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">
                Send Message
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setError("");
                }}
                className="text-gray-500 hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="px-3 py-2 bg-red-900/30 border border-red-800/50 rounded-lg text-sm text-red-300">
                {error}
              </div>
            )}
            {success && (
              <div className="px-3 py-2 bg-brand-900/30 border border-brand-800/50 rounded-lg text-sm text-brand-300">
                {success}
              </div>
            )}

            <form onSubmit={(e) => void handleSend(e)} className="space-y-3">
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
                    No active sessions. Activate a session first.
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
                <p className="text-xs text-gray-600 mt-1">
                  Include country code, no + or spaces
                </p>
              </div>
              <div>
                <label className="label">Message *</label>
                <textarea
                  className="input resize-none"
                  rows={4}
                  placeholder="Type your message…"
                  required
                  maxLength={4096}
                  value={form.message}
                  onChange={(e) =>
                    setForm({ ...form, message: e.target.value })
                  }
                />
                <p className="text-xs text-gray-600 mt-1 text-right">
                  {form.message.length}/4096
                </p>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={sending || sessions.length === 0}
                >
                  {sending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {sending ? "Sending…" : "Send"}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowForm(false);
                    setError("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Messages list */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-5 h-5 text-gray-500 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No messages yet"
            description="Send your first message or wait for inbound messages via webhook."
            action={
              <button className="btn-primary" onClick={() => setShowForm(true)}>
                <Send className="w-4 h-4" />
                Send Message
              </button>
            }
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  Dir
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  From → To
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  Content
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  Status
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  Time
                </th>
              </tr>
            </thead>
            <tbody>
              {messages.map((m) => (
                <tr key={m.id} className="table-row">
                  <td className="px-5 py-3">
                    {m.direction === "inbound" ? (
                      <ArrowDownLeft className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4 text-indigo-400" />
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs font-mono">
                    <span className="text-gray-300">{m.from}</span>
                    <span className="text-gray-600 mx-1">→</span>
                    {m.to}
                  </td>
                  <td className="px-5 py-3 text-gray-200 max-w-xs truncate">
                    {m.content}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge value={m.status} />
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {new Date(m.createdAt).toLocaleString()}
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
