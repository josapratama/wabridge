import { useState } from "react";
import { ALL_EVENTS } from "../constants";
import { X, Check, RefreshCw } from "lucide-react";

interface Props {
  onSubmit: (form: {
    name: string;
    url: string;
    secret?: string;
    events: string[];
  }) => Promise<{ success: boolean; message: string }>;
  onClose: () => void;
}

export default function WebhookForm({ onSubmit, onClose }: Props) {
  const [form, setForm] = useState({
    name: "",
    url: "",
    secret: "",
    events: [] as string[],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggleEvent = (ev: string) =>
    setForm((f) => ({
      ...f,
      events: f.events.includes(ev)
        ? f.events.filter((e) => e !== ev)
        : [...f.events, ev],
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.events.length === 0) {
      setError("Select at least one event");
      return;
    }
    setSaving(true);
    setError("");
    const res = await onSubmit({
      name: form.name,
      url: form.url,
      secret: form.secret || undefined,
      events: form.events,
    });
    if (!res.success) setError(res.message);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="card w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">
            New Webhook Endpoint
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
            <label className="label">Name *</label>
            <input
              className="input"
              placeholder="e.g. My App Webhook"
              required
              minLength={3}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">URL *</label>
            <input
              className="input"
              type="url"
              placeholder="https://myapp.com/webhook"
              required
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Secret (optional)</label>
            <input
              className="input"
              placeholder="Used for HMAC-SHA256 signature verification"
              value={form.secret}
              onChange={(e) => setForm({ ...form, secret: e.target.value })}
            />
            <p className="text-xs text-gray-600 mt-1">
              Sent as X-Webhook-Signature header
            </p>
          </div>
          <div>
            <label className="label">Events *</label>
            <div className="grid grid-cols-2 gap-1.5 mt-1">
              {ALL_EVENTS.map((ev) => (
                <button
                  key={ev}
                  type="button"
                  onClick={() => toggleEvent(ev)}
                  className={`text-left px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors border ${
                    form.events.includes(ev)
                      ? "bg-brand-600/20 border-brand-700/50 text-brand-300"
                      : "bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200"
                  }`}
                >
                  {form.events.includes(ev) ? "✓ " : ""}
                  {ev}
                </button>
              ))}
            </div>
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
              {saving ? "Creating…" : "Create"}
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
