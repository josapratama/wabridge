import { useEffect, useState } from "react";
import { providerConfigsApi, ProviderConfig } from "../../api/client";
import StatusBadge from "../../components/StatusBadge";
import EmptyState from "../../components/EmptyState";
import BaileysConnectionModal from "../../components/BaileysConnectionModal";
import {
  Settings2,
  Plus,
  X,
  Check,
  PowerOff,
  Power,
  RefreshCw,
  QrCode,
  Smartphone,
  HelpCircle,
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
  const [qrModal, setQrModal] = useState<{
    show: boolean;
    configId: string;
    qrCode: string | null;
    pairingCode: string | null;
  }>({
    show: false,
    configId: "",
    qrCode: null,
    pairingCode: null,
  });
  const [qrLoading, setQrLoading] = useState(false);

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

    // Clean up the form data - remove empty/undefined fields
    const cleanedForm: Partial<ProviderConfig> = {
      providerType: form.providerType,
      name: form.name,
    };

    // Only add fields that have values
    if (form.baseUrl) cleanedForm.baseUrl = form.baseUrl;
    if (form.apiVersion) cleanedForm.apiVersion = form.apiVersion;
    if (form.phoneNumberId) cleanedForm.phoneNumberId = form.phoneNumberId;
    if (form.wabaId) cleanedForm.wabaId = form.wabaId;
    if (form.verifyToken) cleanedForm.verifyToken = form.verifyToken;
    if (form.webhookSecret) cleanedForm.webhookSecret = form.webhookSecret;

    // Only add accessToken if not Baileys and has value
    if (form.providerType !== "baileys" && form.accessToken) {
      cleanedForm.accessToken = form.accessToken;
    }

    const res = await providerConfigsApi.create(cleanedForm);
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

      // If Baileys, show QR code modal after activation
      if (cfg.providerType === "baileys") {
        await showQrCode(cfg.id);
      }
    }
    await load();
  };

  const showQrCode = async (configId: string) => {
    setQrModal({
      show: true,
      configId,
      qrCode: null,
      pairingCode: null,
    });
    setQrLoading(false); // Don't start loading immediately
  };

  const generateQrCode = async () => {
    setQrLoading(true);
    setQrModal((prev) => ({ ...prev, qrCode: null }));

    // Poll for QR code
    const pollQr = async () => {
      const res = await providerConfigsApi.getQrCode(qrModal.configId);
      if (res.data?.qrCode) {
        setQrModal((prev) => ({ ...prev, qrCode: res.data?.qrCode || null }));
        setQrLoading(false);
      } else {
        // Keep polling every 2 seconds
        setTimeout(() => void pollQr(), 2000);
      }
    };

    await pollQr();
  };

  const requestPairingCode = async (phoneNumber: string) => {
    if (!phoneNumber) {
      return;
    }

    setQrLoading(true);

    try {
      const res = await providerConfigsApi.requestPairingCode(
        qrModal.configId,
        phoneNumber,
      );

      if (res.data?.pairingCode) {
        setQrModal((prev) => ({
          ...prev,
          pairingCode: res.data?.pairingCode || null,
        }));
      } else {
        // No pairing code returned - show error
        console.error("No pairing code returned from API");
      }
    } catch (err) {
      console.error("Failed to request pairing code:", err);
    } finally {
      setQrLoading(false);
    }
  };

  const closeQrModal = () => {
    setQrModal({
      show: false,
      configId: "",
      qrCode: null,
      pairingCode: null,
    });
    setQrLoading(false);
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

      {/* Baileys Connection Modal */}
      <BaileysConnectionModal
        show={qrModal.show}
        configId={qrModal.configId}
        onClose={closeQrModal}
        onRequestQrCode={generateQrCode}
        onRequestPairingCode={requestPairingCode}
        qrCode={qrModal.qrCode}
        pairingCode={qrModal.pairingCode}
        loading={qrLoading}
      />

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">
                New Provider Config
              </h2>
              <div className="flex items-center gap-2">
                <a
                  href="https://github.com/yourusername/yourrepo/blob/main/TOKEN_GUIDE.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-300 transition-colors"
                  title="Token Guide"
                >
                  <HelpCircle className="w-5 h-5" />
                </a>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-500 hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
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
                    <option value="baileys">Baileys (WhatsApp Web)</option>
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
                <label className="label">
                  Access Token {form.providerType !== "baileys" && "*"}
                </label>
                <input
                  className="input"
                  type="password"
                  placeholder={
                    form.providerType === "baileys"
                      ? "Not required for Baileys"
                      : form.providerType === "meta-cloud"
                        ? "EAAxxxxx... (from Meta for Developers)"
                        : "API Key from your BSP provider"
                  }
                  required={form.providerType !== "baileys"}
                  disabled={form.providerType === "baileys"}
                  value={form.accessToken ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, accessToken: e.target.value })
                  }
                />
                {form.providerType === "meta-cloud" && (
                  <p className="text-xs text-gray-500 mt-1">
                    Get from: Meta for Developers → Your App → WhatsApp →
                    Getting Started
                  </p>
                )}
                {form.providerType === "bsp" && (
                  <p className="text-xs text-gray-500 mt-1">
                    Get from your BSP provider dashboard (Twilio, MessageBird,
                    etc.)
                  </p>
                )}
              </div>

              {form.providerType === "baileys" ? (
                <div className="px-4 py-3 bg-blue-900/20 border border-blue-800/30 rounded-lg">
                  <div className="flex gap-3">
                    <Smartphone className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-blue-300 font-medium mb-1">
                        WhatsApp Web Connection
                      </p>
                      <p className="text-blue-400/80 text-xs leading-relaxed">
                        After creating this config, activate it to generate a QR
                        code. Scan the QR code with your WhatsApp mobile app to
                        connect.
                      </p>
                    </div>
                  </div>
                </div>
              ) : form.providerType === "meta-cloud" ? (
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
                  placeholder={
                    form.providerType === "baileys"
                      ? "Not required for Baileys"
                      : "Create your own random string (e.g., my_token_123)"
                  }
                  disabled={form.providerType === "baileys"}
                  value={form.verifyToken ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, verifyToken: e.target.value })
                  }
                />
                {form.providerType !== "baileys" && (
                  <p className="text-xs text-gray-500 mt-1">
                    Create a random string. You'll use this when setting up
                    webhooks.
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
                    <div className="flex items-center justify-end gap-2">
                      {cfg.providerType === "baileys" && cfg.isActive && (
                        <button
                          onClick={() => void showQrCode(cfg.id)}
                          className="btn-secondary text-xs"
                          title="Show QR Code"
                        >
                          <QrCode className="w-3.5 h-3.5" /> QR Code
                        </button>
                      )}
                      <button
                        onClick={() => void toggle(cfg)}
                        className={
                          cfg.isActive
                            ? "btn-danger text-xs"
                            : "btn-secondary text-xs"
                        }
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
