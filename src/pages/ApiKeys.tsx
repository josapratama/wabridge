import { useEffect, useState } from "react";
import { apiKeysApi, ApiKey } from "../api/client";
import EmptyState from "../components/EmptyState";
import {
  Key,
  Plus,
  X,
  Check,
  RefreshCw,
  Copy,
  Trash2,
  AlertTriangle,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (text: string, key: string) => {
    void navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };
  return { copied, copy };
}

export default function ApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", expiresAt: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [newKey, setNewKey] = useState<ApiKey | null>(null);
  const [showNewKey, setShowNewKey] = useState(false);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const { copied, copy } = useCopy();

  const load = async () => {
    setLoading(true);
    const res = await apiKeysApi.list();
    if (res.data) setKeys(res.data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await apiKeysApi.create({
      name: form.name,
      expiresAt: form.expiresAt || undefined,
    });
    if (res.success && res.data) {
      setNewKey(res.data);
      setShowNewKey(true);
      setShowForm(false);
      setForm({ name: "", expiresAt: "" });
      await load();
    } else {
      setError(res.message);
    }
    setSaving(false);
  };

  const handleRevoke = async (id: string) => {
    await apiKeysApi.revoke(id);
    setRevokeId(null);
    await load();
  };

  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString() : "—";

  const isExpired = (iso?: string) =>
    iso ? new Date(iso) < new Date() : false;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-400" />
            API Keys
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage keys for accessing the public API
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
            <Plus className="w-4 h-4" /> New API Key
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="card p-4 flex gap-3">
        <div className="w-1 rounded-full bg-brand-600 shrink-0" />
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-300">How to use</p>
          <p className="text-xs text-gray-500">
            Include your API key in the{" "}
            <code className="text-brand-400">X-API-Key</code> header when
            calling{" "}
            <code className="text-brand-400">POST /v1/messages/send</code>. The
            plain key is shown only once at creation.
          </p>
        </div>
      </div>

      {/* New key revealed modal */}
      {showNewKey && newKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-600/20 flex items-center justify-center">
                <Key className="w-5 h-5 text-brand-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  API Key Created
                </p>
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
                  {newKey.key}
                </div>
                <button
                  onClick={() => copy(newKey.key!, "new-key")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
                >
                  {copied === "new-key" ? (
                    <Check className="w-4 h-4 text-brand-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
              <div>
                <p className="text-gray-600">Name</p>
                <p className="text-gray-300">{newKey.name}</p>
              </div>
              <div>
                <p className="text-gray-600">Expires</p>
                <p className="text-gray-300">{formatDate(newKey.expiresAt)}</p>
              </div>
            </div>

            <button
              onClick={() => {
                setShowNewKey(false);
                setNewKey(null);
              }}
              className="btn-primary w-full justify-center"
            >
              <Check className="w-4 h-4" />
              I've saved the key
            </button>
          </div>
        </div>
      )}

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="card w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">New API Key</p>
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
                  onChange={(e) =>
                    setForm({ ...form, expiresAt: e.target.value })
                  }
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

      {/* Revoke confirm modal */}
      {revokeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="card w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-900/30 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Revoke API Key
                </p>
                <p className="text-xs text-gray-500">
                  This action cannot be undone
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-400">
              Any application using this key will immediately lose access.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => void handleRevoke(revokeId)}
                className="btn-danger flex-1 justify-center"
              >
                <Trash2 className="w-4 h-4" /> Revoke Key
              </button>
              <button
                onClick={() => setRevokeId(null)}
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
        ) : keys.length === 0 ? (
          <EmptyState
            icon={Key}
            title="No API keys"
            description="Create an API key to start sending messages from your application."
            action={
              <button className="btn-primary" onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4" /> New API Key
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
                  Key Prefix
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  Status
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  Last Used
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  Expires
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  Created
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id} className="table-row">
                  <td className="px-5 py-3 font-medium text-gray-200">
                    {k.name}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-brand-400 font-mono bg-brand-900/20 px-2 py-0.5 rounded">
                        {k.keyPrefix}…
                      </code>
                      <button
                        onClick={() => copy(k.keyPrefix, k.id)}
                        className="text-gray-600 hover:text-gray-400 transition-colors"
                      >
                        {copied === k.id ? (
                          <Check className="w-3 h-3 text-brand-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {k.isActive && !isExpired(k.expiresAt) ? (
                      <span className="inline-flex items-center gap-1 text-xs text-brand-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-red-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        {isExpired(k.expiresAt) ? "Expired" : "Revoked"}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {formatDate(k.lastUsedAt)}
                  </td>
                  <td className="px-5 py-3 text-xs">
                    <span
                      className={
                        isExpired(k.expiresAt)
                          ? "text-red-400"
                          : "text-gray-500"
                      }
                    >
                      {formatDate(k.expiresAt)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {formatDate(k.createdAt)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {k.isActive && (
                      <button
                        onClick={() => setRevokeId(k.id)}
                        className="btn-danger text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Revoke
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
