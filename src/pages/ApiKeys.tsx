import { useEffect, useState } from "react";
import { apiKeysApi, ipWhitelistApi, ApiKey, IpWhitelist } from "../api/client";
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
  ShieldCheck,
  Shield,
  ChevronDown,
  ChevronRight,
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

function IpWhitelistPanel({ apiKeyId }: { apiKeyId: string }) {
  const [ips, setIps] = useState<IpWhitelist[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ cidr: "", label: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await ipWhitelistApi.list(apiKeyId);
    if (res.data) setIps(res.data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [apiKeyId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await ipWhitelistApi.add(apiKeyId, form.cidr, form.label || undefined);
    setForm({ cidr: "", label: "" });
    await load();
    setSaving(false);
  };

  const handleRemove = async (id: string) => {
    await ipWhitelistApi.remove(apiKeyId, id);
    await load();
  };

  return (
    <div className="px-5 pb-4 space-y-3 bg-gray-950/50 border-t border-gray-800">
      <p className="text-xs text-gray-500 pt-3">
        {ips.length === 0
          ? "No IP restrictions — all IPs allowed."
          : `${ips.length} IP rule(s) — only listed IPs can use this key.`}
      </p>
      {loading ? (
        <RefreshCw className="w-3.5 h-3.5 text-gray-600 animate-spin" />
      ) : (
        <div className="space-y-1.5">
          {ips.map((ip) => (
            <div
              key={ip.id}
              className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-1.5"
            >
              <code className="text-xs text-brand-400 font-mono flex-1">
                {ip.cidr}
              </code>
              {ip.label && (
                <span className="text-xs text-gray-500">{ip.label}</span>
              )}
              <button
                onClick={() => void handleRemove(ip.id)}
                className="text-gray-600 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={(e) => void handleAdd(e)} className="flex gap-2">
        <input
          className="input text-xs flex-1"
          placeholder="192.168.1.0/24 or 1.2.3.4/32"
          required
          value={form.cidr}
          onChange={(e) => setForm({ ...form, cidr: e.target.value })}
        />
        <input
          className="input text-xs w-28"
          placeholder="Label (opt)"
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
        />
        <button
          type="submit"
          className="btn-secondary text-xs shrink-0"
          disabled={saving}
        >
          {saving ? (
            <RefreshCw className="w-3 h-3 animate-spin" />
          ) : (
            <Plus className="w-3 h-3" />
          )}
          Add
        </button>
      </form>
    </div>
  );
}

export default function ApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", expiresAt: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [newKey, setNewKey] = useState<ApiKey | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [expandedIp, setExpandedIp] = useState<string | null>(null);
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

  const fmt = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString() : "—";
  const isExpired = (iso?: string) =>
    iso ? new Date(iso) < new Date() : false;

  return (
    <div className="p-6 space-y-5">
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

      {/* Info */}
      <div className="card p-4 flex gap-3">
        <div className="w-1 rounded-full bg-brand-600 shrink-0" />
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-300">How to use</p>
          <p className="text-xs text-gray-500">
            Pass your key in the{" "}
            <code className="text-brand-400">X-API-Key</code> header when
            calling{" "}
            <code className="text-brand-400">POST /v1/messages/send</code>. The
            plain key is shown only once.
          </p>
        </div>
      </div>

      {/* New key modal */}
      {newKey && (
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
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-gray-600">Name</p>
                <p className="text-gray-300">{newKey.name}</p>
              </div>
              <div>
                <p className="text-gray-600">Expires</p>
                <p className="text-gray-300">{fmt(newKey.expiresAt)}</p>
              </div>
            </div>
            <button
              onClick={() => setNewKey(null)}
              className="btn-primary w-full justify-center"
            >
              <Check className="w-4 h-4" /> I've saved the key
            </button>
          </div>
        </div>
      )}

      {/* Create form */}
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

      {/* Revoke confirm */}
      {revokeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="card w-full max-w-sm p-6 space-y-4">
            <p className="text-sm font-semibold text-white">Revoke API Key?</p>
            <p className="text-xs text-gray-400">
              Any application using this key will immediately lose access.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => void handleRevoke(revokeId)}
                className="btn-danger flex-1 justify-center"
              >
                <Trash2 className="w-4 h-4" /> Revoke
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
          <div className="divide-y divide-gray-800">
            {keys.map((k) => (
              <div key={k.id}>
                {/* Row */}
                <div className="flex items-center gap-4 px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-200">
                      {k.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <code className="text-xs text-brand-400 font-mono bg-brand-900/20 px-1.5 py-0.5 rounded">
                        {k.keyPrefix}…
                      </code>
                      <button
                        onClick={() => copy(k.keyPrefix, k.id)}
                        className="text-gray-600 hover:text-gray-400"
                      >
                        {copied === k.id ? (
                          <Check className="w-3 h-3 text-brand-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 hidden sm:block">
                    Last used: {fmt(k.lastUsedAt)}
                  </div>
                  <div className="text-xs hidden sm:block">
                    <span
                      className={
                        isExpired(k.expiresAt)
                          ? "text-red-400"
                          : "text-gray-500"
                      }
                    >
                      Exp: {fmt(k.expiresAt)}
                    </span>
                  </div>
                  <div>
                    {k.isActive && !isExpired(k.expiresAt) ? (
                      <span className="inline-flex items-center gap-1 text-xs text-brand-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />{" "}
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-red-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        {isExpired(k.expiresAt) ? "Expired" : "Revoked"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setExpandedIp(expandedIp === k.id ? null : k.id)
                      }
                      className="btn-secondary text-xs"
                      title="IP Whitelist"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      {expandedIp === k.id ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                    </button>
                    {k.isActive && (
                      <button
                        onClick={() => setRevokeId(k.id)}
                        className="btn-danger text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Revoke
                      </button>
                    )}
                  </div>
                </div>
                {/* IP Whitelist panel */}
                {expandedIp === k.id && <IpWhitelistPanel apiKeyId={k.id} />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
