import { useEffect, useState } from "react";
import {
  broadcastApi,
  sessionsApi,
  contactsApi,
  BroadcastJob,
  Session,
  Contact,
} from "../../api/client";
import EmptyState from "../../components/EmptyState";
import { Radio, Plus, X, RefreshCw, Play, Ban } from "lucide-react";

const statusColor: Record<string, string> = {
  pending: "text-yellow-400",
  running: "text-blue-400",
  completed: "text-brand-400",
  failed: "text-red-400",
  cancelled: "text-gray-500",
};

export default function Broadcast() {
  const [jobs, setJobs] = useState<BroadcastJob[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    sessionId: "",
    content: "",
    recipients: "",
    delayMs: "2000",
  });
  const [useContacts, setUseContacts] = useState(false);
  const [selectedTag, setSelectedTag] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    const [j, s, c] = await Promise.all([
      broadcastApi.list(),
      sessionsApi.list(),
      contactsApi.list(),
    ]);
    if (j.data) setJobs([...j.data].reverse());
    if (s.data) setSessions(s.data.filter((s) => s.status === "active"));
    if (c.data) setContacts(c.data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const allTags = [...new Set(contacts.flatMap((c) => c.tags))];

  const getRecipients = (): string[] => {
    if (useContacts) {
      const filtered = selectedTag
        ? contacts.filter((c) => c.tags.includes(selectedTag))
        : contacts;
      return filtered.map((c) => c.phone);
    }
    return form.recipients
      .split("\n")
      .map((r) => r.trim())
      .filter(Boolean);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const recipients = getRecipients();
    if (recipients.length === 0) {
      setError("No recipients");
      return;
    }
    setSaving(true);
    setError("");
    const res = await broadcastApi.create({
      name: form.name,
      sessionId: form.sessionId,
      content: form.content,
      recipients,
      delayMs: parseInt(form.delayMs),
    });
    if (res.success && res.data) {
      await broadcastApi.start(res.data.id);
      setShowForm(false);
      await load();
    } else {
      setError(res.message);
    }
    setSaving(false);
  };

  const handleCancel = async (id: string) => {
    await broadcastApi.cancel(id);
    await load();
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-brand-400" />
            Broadcast
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Send messages to multiple recipients
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
            <Plus className="w-4 h-4" /> New Broadcast
          </button>
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="card w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">New Broadcast</p>
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
                <label className="label">Name *</label>
                <input
                  className="input"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Promo April"
                />
              </div>
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
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Message *</label>
                <textarea
                  className="input resize-none"
                  rows={4}
                  required
                  maxLength={4096}
                  value={form.content}
                  onChange={(e) =>
                    setForm({ ...form, content: e.target.value })
                  }
                  placeholder="Your broadcast message..."
                />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <label className="label mb-0">Recipients</label>
                  <div className="flex gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={() => setUseContacts(false)}
                      className={`text-xs px-2 py-1 rounded ${!useContacts ? "bg-brand-600 text-white" : "bg-gray-800 text-gray-400"}`}
                    >
                      Manual
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseContacts(true)}
                      className={`text-xs px-2 py-1 rounded ${useContacts ? "bg-brand-600 text-white" : "bg-gray-800 text-gray-400"}`}
                    >
                      From Contacts
                    </button>
                  </div>
                </div>
                {useContacts ? (
                  <div className="space-y-2">
                    <select
                      className="input"
                      value={selectedTag}
                      onChange={(e) => setSelectedTag(e.target.value)}
                    >
                      <option value="">All contacts ({contacts.length})</option>
                      {allTags.map((t) => (
                        <option key={t} value={t}>
                          {t} (
                          {contacts.filter((c) => c.tags.includes(t)).length})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500">
                      {
                        (selectedTag
                          ? contacts.filter((c) => c.tags.includes(selectedTag))
                          : contacts
                        ).length
                      }{" "}
                      recipients selected
                    </p>
                  </div>
                ) : (
                  <textarea
                    className="input resize-none font-mono text-xs"
                    rows={5}
                    placeholder={"628123456789\n628987654321\n..."}
                    value={form.recipients}
                    onChange={(e) =>
                      setForm({ ...form, recipients: e.target.value })
                    }
                  />
                )}
              </div>
              <div>
                <label className="label">Delay between messages (ms)</label>
                <input
                  type="number"
                  className="input"
                  min={500}
                  max={30000}
                  value={form.delayMs}
                  onChange={(e) =>
                    setForm({ ...form, delayMs: e.target.value })
                  }
                />
                <p className="text-xs text-gray-600 mt-1">
                  Min 500ms recommended to avoid ban
                </p>
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
                    <Play className="w-4 h-4" />
                  )}
                  {saving ? "Starting…" : "Start Broadcast"}
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
        ) : jobs.length === 0 ? (
          <EmptyState
            icon={Radio}
            title="No broadcasts"
            description="Create a broadcast to send messages to multiple recipients."
            action={
              <button className="btn-primary" onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4" /> New Broadcast
              </button>
            }
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  Name
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  Progress
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  Status
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  Created
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => {
                const pct =
                  job.totalCount > 0
                    ? Math.round(
                        ((job.sentCount + job.failedCount) / job.totalCount) *
                          100,
                      )
                    : 0;
                return (
                  <tr key={job.id} className="table-row">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-200">{job.name}</p>
                      <p className="text-xs text-gray-500">
                        {job.totalCount} recipients
                      </p>
                    </td>
                    <td className="px-5 py-3 w-40">
                      <div className="space-y-1">
                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-500 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          {job.sentCount} sent · {job.failedCount} failed
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-xs font-medium ${statusColor[job.status] ?? "text-gray-400"}`}
                      >
                        ● {job.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500">
                      {new Date(job.createdAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {(job.status === "running" ||
                        job.status === "pending") && (
                        <button
                          onClick={() => void handleCancel(job.id)}
                          className="btn-danger text-xs"
                        >
                          <Ban className="w-3.5 h-3.5" /> Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
