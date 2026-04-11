import { useEffect, useState } from "react";
import {
  autoReplyApi,
  sessionsApi,
  AutoReplyRule,
  Session,
} from "../api/client";
import EmptyState from "../components/EmptyState";
import {
  Bot,
  Plus,
  X,
  Check,
  RefreshCw,
  Trash2,
  Pencil,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

const MATCH_TYPES = [
  {
    value: "contains",
    label: "Contains",
    desc: "Message includes the keyword",
  },
  { value: "exact", label: "Exact", desc: "Message matches exactly" },
  {
    value: "starts_with",
    label: "Starts with",
    desc: "Message begins with keyword",
  },
  { value: "regex", label: "Regex", desc: "Advanced pattern matching" },
] as const;

type MatchType = "contains" | "exact" | "starts_with" | "regex";

const emptyForm = {
  name: "",
  sessionId: "",
  matchType: "contains" as MatchType,
  matchValue: "",
  replyContent: "",
  priority: 0,
};

export default function AutoReply() {
  const [rules, setRules] = useState<AutoReplyRule[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AutoReplyRule | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [r, s] = await Promise.all([autoReplyApi.list(), sessionsApi.list()]);
    if (r.data) setRules([...r.data].sort((a, b) => b.priority - a.priority));
    if (s.data) setSessions(s.data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  };
  const openEdit = (rule: AutoReplyRule) => {
    setEditing(rule);
    setForm({
      name: rule.name,
      sessionId: rule.sessionId ?? "",
      matchType: rule.matchType,
      matchValue: rule.matchValue,
      replyContent: rule.replyContent,
      priority: rule.priority,
    });
    setError("");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = { ...form, sessionId: form.sessionId || undefined };
    if (editing) {
      const res = await autoReplyApi.update(editing.id, payload);
      if (res.success) {
        setShowForm(false);
        await load();
      } else setError(res.message);
    } else {
      const res = await autoReplyApi.create({ ...payload, isActive: true });
      if (res.success) {
        setShowForm(false);
        await load();
      } else setError(res.message);
    }
    setSaving(false);
  };

  const toggleActive = async (rule: AutoReplyRule) => {
    await autoReplyApi.update(rule.id, { isActive: !rule.isActive });
    await load();
  };

  const handleDelete = async (id: string) => {
    await autoReplyApi.delete(id);
    setDeleteId(null);
    await load();
  };

  const sessionName = (id?: string) => {
    if (!id) return "All sessions";
    return sessions.find((s) => s.id === id)?.name ?? id.slice(0, 8) + "…";
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Bot className="w-5 h-5 text-brand-400" />
            Auto-reply Rules
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Automatically reply to inbound messages
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
          <button onClick={openCreate} className="btn-primary">
            <Plus className="w-4 h-4" /> New Rule
          </button>
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="card w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">
                {editing ? "Edit Rule" : "New Auto-reply Rule"}
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
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
              <div>
                <label className="label">Rule Name *</label>
                <input
                  className="input"
                  placeholder="e.g. Greeting Reply"
                  required
                  minLength={3}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Apply to Session</label>
                <select
                  className="input"
                  value={form.sessionId}
                  onChange={(e) =>
                    setForm({ ...form, sessionId: e.target.value })
                  }
                >
                  <option value="">All sessions</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Match Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  {MATCH_TYPES.map((mt) => (
                    <button
                      key={mt.value}
                      type="button"
                      onClick={() => setForm({ ...form, matchType: mt.value })}
                      className={`text-left px-3 py-2 rounded-lg border text-xs transition-colors ${
                        form.matchType === mt.value
                          ? "bg-brand-600/20 border-brand-700/50 text-brand-300"
                          : "bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200"
                      }`}
                    >
                      <p className="font-medium">{mt.label}</p>
                      <p className="text-gray-500 text-[10px] mt-0.5">
                        {mt.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Match Value *</label>
                <input
                  className="input"
                  required
                  placeholder={
                    form.matchType === "regex" ? "^hello.*" : "hello"
                  }
                  value={form.matchValue}
                  onChange={(e) =>
                    setForm({ ...form, matchValue: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">Reply Message *</label>
                <textarea
                  className="input resize-none"
                  rows={3}
                  required
                  maxLength={4096}
                  placeholder="Hi! Thanks for your message. We'll get back to you soon."
                  value={form.replyContent}
                  onChange={(e) =>
                    setForm({ ...form, replyContent: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">Priority</label>
                <input
                  type="number"
                  className="input"
                  min={0}
                  max={100}
                  value={form.priority}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      priority: parseInt(e.target.value) || 0,
                    })
                  }
                />
                <p className="text-xs text-gray-600 mt-1">
                  Higher number = checked first (0–100)
                </p>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={saving}
                >
                  {saving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {saving ? "Saving…" : editing ? "Update" : "Create"}
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

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="card w-full max-w-sm p-6 space-y-4">
            <p className="text-sm font-semibold text-white">Delete Rule?</p>
            <div className="flex gap-2">
              <button
                onClick={() => void handleDelete(deleteId)}
                className="btn-danger flex-1 justify-center"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
              <button
                onClick={() => setDeleteId(null)}
                className="btn-secondary flex-1 justify-center"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-5 h-5 text-gray-500 animate-spin" />
          </div>
        ) : rules.length === 0 ? (
          <EmptyState
            icon={Bot}
            title="No auto-reply rules"
            description="Create rules to automatically reply to inbound messages."
            action={
              <button className="btn-primary" onClick={openCreate}>
                <Plus className="w-4 h-4" /> New Rule
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
                  Session
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  Match
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  Reply
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  Priority
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  Active
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id} className="table-row">
                  <td className="px-5 py-3 font-medium text-gray-200">
                    {rule.name}
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-400">
                    {sessionName(rule.sessionId)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded font-mono">
                        {rule.matchType}
                      </span>
                      <p className="text-xs text-gray-300 font-mono truncate max-w-[120px]">
                        {rule.matchValue}
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-400 max-w-[160px] truncate">
                    {rule.replyContent}
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-400">
                    {rule.priority}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => void toggleActive(rule)}
                      className="text-gray-400 hover:text-gray-200 transition-colors"
                    >
                      {rule.isActive ? (
                        <ToggleRight className="w-5 h-5 text-brand-400" />
                      ) : (
                        <ToggleLeft className="w-5 h-5" />
                      )}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(rule)}
                        className="btn-secondary text-xs"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteId(rule.id)}
                        className="btn-danger text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
