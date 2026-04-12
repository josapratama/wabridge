import { useState } from "react";
import { AutoReplyRule, Session } from "../../../api/client";
import { MATCH_TYPES, EMPTY_FORM, RuleForm } from "../hooks/useAutoReply";
import { X, Check, RefreshCw } from "lucide-react";

interface Props {
  editing: AutoReplyRule | null;
  sessions: Session[];
  onSubmit: (form: RuleForm) => Promise<{ success: boolean; message: string }>;
  onClose: () => void;
}

export default function AutoReplyForm({
  editing,
  sessions,
  onSubmit,
  onClose,
}: Props) {
  const [form, setForm] = useState<RuleForm>(
    editing
      ? {
          name: editing.name,
          sessionId: editing.sessionId ?? "",
          matchType: editing.matchType,
          matchValue: editing.matchValue,
          replyContent: editing.replyContent,
          priority: editing.priority,
        }
      : EMPTY_FORM,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await onSubmit(form);
    if (!res.success) setError(res.message);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="card w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">
            {editing ? "Edit Rule" : "New Auto-reply Rule"}
          </p>
          <button
            onClick={onClose}
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
              onChange={(e) => setForm({ ...form, sessionId: e.target.value })}
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
                  <p className="text-gray-500 text-[10px] mt-0.5">{mt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Match Value *</label>
            <input
              className="input"
              required
              placeholder={form.matchType === "regex" ? "^hello.*" : "hello"}
              value={form.matchValue}
              onChange={(e) => setForm({ ...form, matchValue: e.target.value })}
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
                setForm({ ...form, priority: parseInt(e.target.value) || 0 })
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
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
