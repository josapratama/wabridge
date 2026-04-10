import { useEffect, useState } from "react";
import { providerConfigsApi, ProviderConfig } from "../api/client";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";
import {
  Settings2,
  Plus,
  X,
  Check,
  PowerOff,
  Power,
  RefreshCw,
} from "lucide-react";

const EMPTY: Partial<ProviderConfig> = {
  providerType: "meta-cloud",
  name: "",
  accessToken: "",
  phoneNumberId: "",
  apiVersion: "v19.0",
  verifyToken: "",
  baseUrl: "",
};

export default function ProviderConfigs() {
  const [configs, setConfigs] = useState<ProviderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<ProviderConfig>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    const res = await providerConfigsApi.list();
    if (res.data) setConfigs(res.data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await providerConfigsApi.create(form);
    if (res.success) {
      setShowForm(false);
      setForm(EMPTY);
      await load();
    } else {
      setError(res.message);
    }
    setSaving(false);
  };

  const toggle = async (cfg: ProviderConfig) => {
    if (cfg.isActive) {
      await providerConfigsApi.deactivate(cfg.id);
    } else {
      await providerConfigsApi.activate(cfg.id);
    }
    await load();
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Provider Configs</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage Meta Cloud and BSP connections
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
            <Plus className="w-4 h-4" /> New Config
          </button>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">
                New Provider Config
              </h2>
              <button
                onClick={() => setShowForm(false)}
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

            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Provider Type</label>
                  <select
                    className="input"
                    value={form.providerType}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        providerType: e.target
                          .value as ProviderConfig["providerType"],
                      })
                    }
                  >
                    <option value="meta-cloud">Meta Cloud API</option>
                    <option value="bsp">BSP / Partner</option>
                  </select>
                </div>
                <div>
                  <label className="label">Name *</label>
                  <input
                    className="input"
                    placeholder="e.g. Production Meta"
                    required
                    minLength={3}
                    value={form.name ?? ""}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="label">Access Token *</label>
                <input
                  className="input"
                  type="password"
                  placeholder="Bearer token"
                  required
                  value={form.accessToken ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, accessToken: e.target.value })
                  }
                />
              </div>

              {form.providerType === "meta-cloud" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Phone Number ID</label>
                    <input
                      className="input"
                      placeholder="1234567890"
                      value={form.phoneNumberId ?? ""}
                      onChange={(e) =>
                        setForm({ ...form, phoneNumberId: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="label">API Version</label>
                    <input
                      className="input"
                      placeholder="v19.0"
                      value={form.apiVersion ?? ""}
                      onChange={(e) =>
                        setForm({ ...form, apiVersion: e.target.value })
                      }
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="label">Base URL</label>
                  <input
                    className="input"
                    placeholder="https://api.bsp-provider.com/v1"
                    value={form.baseUrl ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, baseUrl: e.target.value })
                    }
                  />
                </div>
              )}

              <div>
                <label className="label">Verify Token</label>
                <input
                  className="input"
                  placeholder="Webhook verify token"
                  value={form.verifyToken ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, verifyToken: e.target.value })
                  }
                />
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
                  {saving ? "Saving…" : "Create Config"}
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
        ) : configs.length === 0 ? (
          <EmptyState
            icon={Settings2}
            title="No provider configs"
            description="Create your first provider config to start sending messages."
            action={
              <button className="btn-primary" onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4" />
                New Config
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
                  Type
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  Endpoint
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
              {configs.map((cfg) => (
                <tr key={cfg.id} className="table-row">
                  <td className="px-5 py-3 font-medium text-gray-200">
                    {cfg.name}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge value={cfg.providerType} />
                  </td>
                  <td className="px-5 py-3 text-gray-400 font-mono text-xs truncate max-w-[180px]">
                    {cfg.baseUrl ??
                      `graph.facebook.com/${cfg.apiVersion ?? "v19.0"}`}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge value={cfg.isActive ? "active" : "inactive"} />
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {new Date(cfg.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => void toggle(cfg)}
                      className={cfg.isActive ? "btn-danger" : "btn-secondary"}
                      title={cfg.isActive ? "Deactivate" : "Activate"}
                    >
                      {cfg.isActive ? (
                        <>
                          <PowerOff className="w-3.5 h-3.5" /> Deactivate
                        </>
                      ) : (
                        <>
                          <Power className="w-3.5 h-3.5" /> Activate
                        </>
                      )}
                    </button>
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
