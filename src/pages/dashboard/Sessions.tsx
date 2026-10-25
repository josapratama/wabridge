import { useEffect, useState } from "react";
import {
  sessionsApi,
  Session,
  providerConfigsApi,
  ProviderConfig,
} from "../../api/client";
import StatusBadge from "../../components/StatusBadge";
import EmptyState from "../../components/EmptyState";
import {
  Layers,
  Plus,
  X,
  Check,
  Power,
  PowerOff,
  RefreshCw,
  Copy,
  QrCode,
} from "lucide-react";
import BaileysConnectionModal from "../../components/BaileysConnectionModal";

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (text: string, key: string) => {
    void navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };
  return { copied, copy };
}

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [configs, setConfigs] = useState<ProviderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", providerConfigId: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { copied, copy } = useCopy();

  const [qrModal, setQrModal] = useState<{
    show: boolean;
    configId: string;
    qrCode: string | null;
    pairingCode: string | null;
  }>({ show: false, configId: "", qrCode: null, pairingCode: null });
  const [qrLoading, setQrLoading] = useState(false);

  const openQrModal = (configId: string) => {
    setQrModal({ show: true, configId, qrCode: null, pairingCode: null });
    void generateQrCode(configId);
  };

  const closeQrModal = () => {
    setQrModal({ show: false, configId: "", qrCode: null, pairingCode: null });
    setQrLoading(false);
    void load();
  };

  const generateQrCode = async (configId?: string) => {
    const cId = configId || qrModal.configId;
    if (!cId) return;
    setQrLoading(true);
    setQrModal((prev) => ({ ...prev, qrCode: null }));

    const poll = async () => {
      const res = await providerConfigsApi.getQrCode(cId);
      if (res.data?.qrCode) {
        setQrModal((prev) => ({ ...prev, qrCode: res.data?.qrCode ?? null }));
        setQrLoading(false);
      } else {
        setTimeout(() => void poll(), 2000);
      }
    };
    await poll();
  };

  const requestPairingCode = async (phoneNumber: string) => {
    if (!phoneNumber || !qrModal.configId) return;
    setQrLoading(true);
    try {
      const res = await providerConfigsApi.requestPairingCode(
        qrModal.configId,
        phoneNumber,
      );
      if (res.data?.pairingCode) {
        setQrModal((prev) => ({
          ...prev,
          pairingCode: res.data?.pairingCode ?? null,
        }));
      }
    } finally {
      setQrLoading(false);
    }
  };

  const load = async () => {
    setLoading(true);
    const [s, c] = await Promise.all([
      sessionsApi.list(),
      providerConfigsApi.list(),
    ]);
    if (s.data) setSessions(s.data);
    if (c.data) setConfigs(c.data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await sessionsApi.create(form);
    if (res.success) {
      setShowForm(false);
      setForm({ name: "", providerConfigId: "" });
      await load();
    } else {
      setError(res.message);
    }
    setSaving(false);
  };

  const toggle = async (s: Session) => {
    if (s.status === "active") await sessionsApi.deactivate(s.id);
    else await sessionsApi.activate(s.id);
    await load();
  };

  const configName = (id: string) =>
    configs.find((c) => c.id === id)?.name ?? id.slice(0, 8) + "…";

  return (
    <div className="p-6 space-y-5">
      <BaileysConnectionModal
        show={qrModal.show}
        configId={qrModal.configId}
        onClose={closeQrModal}
        onRequestQrCode={() => generateQrCode()}
        onRequestPairingCode={requestPairingCode}
        qrCode={qrModal.qrCode}
        pairingCode={qrModal.pairingCode}
        loading={qrLoading}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-gray-400">
          Active and configured WhatsApp account sessions
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void load()}
            className="btn-secondary"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> New Session
          </button>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">
                New Session
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
              <div>
                <label className="label">Session Name *</label>
                <input
                  className="input"
                  placeholder="e.g. Main Account"
                  required
                  minLength={3}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Provider Config *</label>
                <select
                  className="input"
                  required
                  value={form.providerConfigId}
                  onChange={(e) =>
                    setForm({ ...form, providerConfigId: e.target.value })
                  }
                >
                  <option value="">Select a config…</option>
                  {configs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.providerType}) {c.isActive ? "✓" : ""}
                    </option>
                  ))}
                </select>
                {configs.length === 0 && (
                  <p className="text-xs text-yellow-500 mt-1">
                    No provider configs found. Create one first.
                  </p>
                )}
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
                  {saving ? "Creating…" : "Create Session"}
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
        ) : sessions.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No sessions"
            description="Create a session to link a provider config to a WhatsApp account."
            action={
              <button className="btn-primary" onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4" />
                New Session
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
                  Session ID
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  Provider
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  Config
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
              {sessions.map((s) => (
                <tr key={s.id} className="table-row">
                  <td className="px-5 py-3 font-medium text-gray-200">
                    {s.name}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-gray-400 font-mono bg-gray-800 px-2 py-0.5 rounded">
                        {s.id}
                      </code>
                      <button
                        onClick={() => copy(s.id, s.id)}
                        className="text-gray-600 hover:text-gray-400 transition-colors shrink-0"
                        title="Copy Session ID"
                      >
                        {copied === s.id ? (
                          <Check className="w-3.5 h-3.5 text-brand-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge value={s.providerType} />
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {configName(s.providerConfigId)}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge value={s.status} />
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {s.providerType === "baileys" && (
                        <button
                          onClick={() => openQrModal(s.providerConfigId)}
                          className="btn-secondary text-xs"
                          title="Connect WhatsApp / Scan QR"
                        >
                          <QrCode className="w-3.5 h-3.5" /> QR Code
                        </button>
                      )}
                      <button
                        onClick={() => void toggle(s)}
                        className={
                          s.status === "active" ? "btn-danger" : "btn-secondary"
                        }
                      >
                        {s.status === "active" ? (
                          <>
                            <PowerOff className="w-3.5 h-3.5" /> Deactivate
                          </>
                        ) : (
                          <>
                            <Power className="w-3.5 h-3.5" /> Activate
                          </>
                        )}
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
