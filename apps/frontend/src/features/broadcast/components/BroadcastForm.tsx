import { useState } from "react";
import { Session, Contact } from "../../../api/client";
import { X, Play, RefreshCw } from "lucide-react";

interface Props {
  sessions: Session[];
  contacts: Contact[];
  allTags: string[];
  onSubmit: (params: {
    name: string;
    sessionId: string;
    content: string;
    recipients: string[];
    delayMs: number;
  }) => Promise<{ success: boolean; message: string }>;
  onClose: () => void;
}

export default function BroadcastForm({
  sessions,
  contacts,
  allTags,
  onSubmit,
  onClose,
}: Props) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const recipients = getRecipients();
    if (recipients.length === 0) {
      setError("No recipients");
      return;
    }
    setSaving(true);
    setError("");
    const res = await onSubmit({
      name: form.name,
      sessionId: form.sessionId,
      content: form.content,
      recipients,
      delayMs: parseInt(form.delayMs),
    });
    if (!res.success) setError(res.message);
    setSaving(false);
  };

  const recipientCount = useContacts
    ? (selectedTag
        ? contacts.filter((c) => c.tags.includes(selectedTag))
        : contacts
      ).length
    : form.recipients.split("\n").filter((r) => r.trim()).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="card w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">New Broadcast</p>
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
            <label className="label">Name *</label>
            <input
              className="input"
              required
              placeholder="e.g. Promo April"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Session *</label>
            <select
              className="input"
              required
              value={form.sessionId}
              onChange={(e) => setForm({ ...form, sessionId: e.target.value })}
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
              placeholder="Your broadcast message..."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
            <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1.5">
              <span>💡 <strong className="text-brand-400">Anti-Ban & Variabel:</strong> Didukung Spintax <code className="bg-gray-800 px-1 py-0.5 rounded text-gray-300">{"{Halo|Hai}"}</code> &amp; variabel <code className="bg-gray-800 px-1 py-0.5 rounded text-gray-300">{"{{name}}"}</code></span>
            </p>
          </div>

          {/* Recipients */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <label className="label mb-0">Recipients</label>
              <div className="flex gap-2 ml-auto">
                {(["Manual", "From Contacts"] as const).map((mode, i) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setUseContacts(i === 1)}
                    className={`text-xs px-2 py-1 rounded ${(i === 1) === useContacts ? "bg-brand-600 text-white" : "bg-gray-800 text-gray-400"}`}
                  >
                    {mode}
                  </button>
                ))}
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
                      {t} ({contacts.filter((c) => c.tags.includes(t)).length})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500">
                  {recipientCount} recipients selected
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
            <div className="flex items-center justify-between mb-1">
              <label className="label mb-0">Smart Anti-Ban Delay (ms)</label>
              <span className="text-[10px] text-brand-400 font-semibold flex items-center gap-1">
                🛡️ Anti-Ban Protected
              </span>
            </div>
            <div className="flex gap-2 mb-2">
              {[
                { label: "Normal (2s)", val: "2000" },
                { label: "Safe (5s)", val: "5000" },
                { label: "Ultra Safe (8s)", val: "8000" },
              ].map((preset) => (
                <button
                  key={preset.val}
                  type="button"
                  onClick={() => setForm({ ...form, delayMs: preset.val })}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                    form.delayMs === preset.val
                      ? "bg-brand-600/20 border-brand-500/40 text-brand-300"
                      : "bg-gray-800 border-gray-700 text-gray-400 hover:text-white"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <input
              type="number"
              className="input"
              min={1000}
              max={60000}
              value={form.delayMs}
              onChange={(e) => setForm({ ...form, delayMs: e.target.value })}
            />
            <p className="text-xs text-gray-500 mt-1">
              Estimated campaign duration: ~{Math.ceil(((recipientCount || 1) * parseInt(form.delayMs || "2000")) / 60000)} minutes. Natural jitter will be applied automatically.
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
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
