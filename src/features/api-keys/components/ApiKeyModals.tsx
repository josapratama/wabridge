import { useState } from "react";
import { ApiKey } from "../../../api/client";
import {
  Key,
  X,
  Check,
  RefreshCw,
  Copy,
  Trash2,
  AlertTriangle,
} from "lucide-react";

// ── New Key Revealed Modal ────────────────────────────────────────────────────

interface NewKeyModalProps {
  apiKey: ApiKey;
  onClose: () => void;
}

export function NewKeyModal({ apiKey, onClose }: NewKeyModalProps) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    void navigator.clipboard.writeText(apiKey.key!);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fmt = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString() : "—";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="card w-full max-w-md p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600/20 flex items-center justify-center">
            <Key className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">API Key Created</p>
            <p className="text-xs text-gray-500">
              Copy it now — it won't be shown again
            </p>
          </div>
        </div>

        <div className="bg-yellow-900/20 border border-yellow-800/40 rounded-lg px-3 py-2 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-400">
            Store this key securely. We cannot recover it.
          </p>
        </div>

        <div>
          <p className="label">Your API Key</p>
          <div className="relative group">
            <div className="input font-mono text-xs text-brand-300 pr-10 break-all select-all">
              {apiKey.key}
            </div>
            <button
              onClick={copy}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4 text-brand-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-gray-600">Name</p>
            <p className="text-gray-300">{apiKey.name}</p>
          </div>
          <div>
            <p className="text-gray-600">Expires</p>
            <p className="text-gray-300">{fmt(apiKey.expiresAt)}</p>
          </div>
        </div>

        <button onClick={onClose} className="btn-primary w-full justify-center">
          <Check className="w-4 h-4" /> I've saved the key
        </button>
      </div>
    </div>
  );
}

// ── Create Key Modal ──────────────────────────────────────────────────────────

interface CreateKeyModalProps {
  onClose: () => void;
  onCreate: (
    name: string,
    expiresAt?: string,
  ) => Promise<{ success: boolean; message: string; data: ApiKey | null }>;
}

export function CreateKeyModal({ onClose, onCreate }: CreateKeyModalProps) {
  const [form, setForm] = useState({ name: "", expiresAt: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await onCreate(form.name, form.expiresAt || undefined);
    if (!res.success) setError(res.message);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="card w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">New API Key</p>
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
            <label className="label">Key Name *</label>
            <input
              className="input"
              placeholder="e.g. Production App"
              required
              minLength={3}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Expires At (optional)</label>
            <input
              type="date"
              className="input"
              value={form.expiresAt}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
            />
            <p className="text-xs text-gray-600 mt-1">
              Leave empty for no expiry
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
                <Key className="w-4 h-4" />
              )}
              {saving ? "Creating…" : "Create Key"}
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

// ── Revoke Confirm Modal ──────────────────────────────────────────────────────

interface RevokeModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export function RevokeModal({ onConfirm, onCancel }: RevokeModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="card w-full max-w-sm p-6 space-y-4">
        <p className="text-sm font-semibold text-white">Revoke API Key?</p>
        <p className="text-xs text-gray-400">
          Any application using this key will immediately lose access.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            className="btn-danger flex-1 justify-center"
          >
            <Trash2 className="w-4 h-4" /> Revoke
          </button>
          <button
            onClick={onCancel}
            className="btn-secondary flex-1 justify-center"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
