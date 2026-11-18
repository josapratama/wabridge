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
  Smartphone,
  Globe,
  Calendar,
} from "lucide-react";
import BaileysConnectionModal from "../../components/BaileysConnectionModal";
import { useI18n } from "../../context/I18nContext";

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
  const { t } = useI18n();
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
    isConnected?: boolean;
  }>({ show: false, configId: "", qrCode: null, pairingCode: null, isConnected: false });
  const [qrLoading, setQrLoading] = useState(false);
  const [pairingLoading, setPairingLoading] = useState(false);

  const openQrModal = (configId: string) => {
    setQrModal({ show: true, configId, qrCode: null, pairingCode: null, isConnected: false });
    void generateQrCode(configId);
  };

  const closeQrModal = () => {
    setQrModal({ show: false, configId: "", qrCode: null, pairingCode: null, isConnected: false });
    setQrLoading(false);
    setPairingLoading(false);
    void load();
  };

  const generateQrCode = async (configId?: string) => {
    const cId = configId || qrModal.configId;
    if (!cId) return;
    setQrLoading(true);
    setQrModal((prev) => ({ ...prev, qrCode: null, isConnected: false }));

    let attempts = 0;
    const maxAttempts = 20;
    const poll = async () => {
      attempts++;
      const res = await providerConfigsApi.getQrCode(cId);
      if (res.data?.isConnected) {
        setQrModal((prev) => ({ ...prev, isConnected: true, qrCode: null }));
        setQrLoading(false);
        return;
      }
      if (res.data?.qrCode) {
        setQrModal((prev) => ({ ...prev, qrCode: res.data?.qrCode ?? null, isConnected: false }));
        setQrLoading(false);
        return;
      }
      if (attempts < maxAttempts) {
        setTimeout(() => void poll(), 1500);
      } else {
        setQrLoading(false);
      }
    };
    await poll();
  };

  const requestPairingCode = async (phoneNumber: string) => {
    if (!phoneNumber || !qrModal.configId) return;
    setPairingLoading(true);
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
      setPairingLoading(false);
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
    <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-5">
      <BaileysConnectionModal
        show={qrModal.show}
        configId={qrModal.configId}
        onClose={closeQrModal}
        onRequestQrCode={() => generateQrCode()}
        onRequestPairingCode={requestPairingCode}
        qrCode={qrModal.qrCode}
        pairingCode={qrModal.pairingCode}
        loading={qrLoading}
        pairingLoading={pairingLoading}
        isConnected={qrModal.isConnected}
      />

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-xs sm:text-sm text-gray-400">
          {t("sessions.subtitle", "Active and configured WhatsApp account sessions")}
        </p>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => void load()}
            className="btn-secondary text-xs sm:text-sm"
            disabled={loading}
            title={t("actions.refresh", "Refresh")}
          >
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={() => setShowForm(true)} className="btn-primary text-xs sm:text-sm shadow-lg shadow-brand-500/20">
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {t("sessions.new_session", "New Session")}
          </button>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="card w-full max-w-md p-6 space-y-4 shadow-2xl border-gray-750">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <h2 className="text-base font-semibold text-white">
                {t("sessions.add_modal_title", "New Session")}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="px-3.5 py-2.5 bg-red-900/30 border border-red-800/50 rounded-lg text-sm text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              <div>
                <label className="label">{t("sessions.session_name", "Session Name")} *</label>
                <input
                  className="input"
                  placeholder={t("sessions.session_name_placeholder", "e.g. Main Account")}
                  required
                  minLength={3}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="label">{t("sessions.provider", "Provider Config")} *</label>
                <select
                  className="input"
                  required
                  value={form.providerConfigId}
                  onChange={(e) =>
                    setForm({ ...form, providerConfigId: e.target.value })
                  }
                >
                  <option value="">{t("sessions.select_provider_placeholder", "Select a config…")}</option>
                  {configs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.providerType}) {c.isActive ? "✓" : ""}
                    </option>
                  ))}
                </select>
                {configs.length === 0 && (
                  <p className="text-xs text-yellow-500 mt-1.5">
                    No provider configs found. Create one first.
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="btn-primary flex-1 justify-center py-2.5 shadow-lg shadow-brand-500/20"
                  disabled={saving}
                >
                  {saving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {saving ? t("actions.saving", "Saving…") : t("actions.create", "Create Session")}
                </button>
                <button
                  type="button"
                  className="btn-secondary py-2.5 px-4"
                  onClick={() => setShowForm(false)}
                >
                  {t("actions.cancel", "Cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sessions Container */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-5 h-5 text-gray-500 animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <EmptyState
            icon={Layers}
            title={t("sessions.title", "No sessions")}
            description={t("sessions.empty", "Create a session to link a provider config to a WhatsApp account.")}
            action={
              <button className="btn-primary shadow-lg shadow-brand-500/20" onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4" />
                {t("sessions.new_session", "New Session")}
              </button>
            }
          />
        ) : (
          <>
            {/* Desktop Table (md+) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-900/40">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {t("contacts.name", "Name")}
                    </th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Session ID
                    </th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {t("sessions.provider", "Provider")}
                    </th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Config
                    </th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {t("sessions.status", "Status")}
                    </th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {t("sessions.created_at", "Created")}
                    </th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {t("provider_configs.actions", "Actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {sessions.map((s) => {
                    const isBaileys = s.providerType === "baileys";
                    return (
                      <tr key={s.id} className="hover:bg-gray-850/50 transition-colors group">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                              isBaileys
                                ? "bg-emerald-950/40 border-emerald-800/40 text-emerald-400"
                                : "bg-blue-950/40 border-blue-800/40 text-blue-400"
                            }`}>
                              {isBaileys ? <Smartphone className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                            </div>
                            <span className="font-semibold text-gray-100 group-hover:text-white transition-colors">
                              {s.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <code className="text-xs text-gray-400 font-mono bg-gray-950/60 border border-gray-800/60 px-2 py-0.5 rounded truncate max-w-[140px]">
                              {s.id}
                            </code>
                            <button
                              onClick={() => copy(s.id, s.id)}
                              className="text-gray-500 hover:text-gray-300 transition-colors shrink-0"
                              title={t("actions.copy", "Copy Session ID")}
                            >
                              {copied === s.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge value={s.providerType} />
                        </td>
                        <td className="px-5 py-4 text-gray-300 text-xs font-medium">
                          {configName(s.providerConfigId)}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge value={s.status} />
                        </td>
                        <td className="px-5 py-4 text-gray-400 text-xs">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-gray-500 shrink-0" />
                            {new Date(s.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {s.providerType === "baileys" && (
                              <button
                                onClick={() => openQrModal(s.providerConfigId)}
                                className="btn-secondary text-xs px-2.5 py-1.5 hover:border-emerald-500/50 hover:text-emerald-300"
                                title={t("sessions.scan_qr", "Connect WhatsApp / Scan QR")}
                              >
                                <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                                <span>{t("provider_configs.qr_code", "QR Code")}</span>
                              </button>
                            )}
                            <button
                              onClick={() => void toggle(s)}
                              className={`text-xs px-2.5 py-1.5 inline-flex items-center gap-1.5 rounded-lg border font-medium transition-colors ${
                                s.status === "active"
                                  ? "bg-red-950/40 border-red-800/50 text-red-300 hover:bg-red-900/60"
                                  : "bg-gray-800/60 border-gray-700/60 text-gray-300 hover:bg-emerald-950/40 hover:border-emerald-800/50 hover:text-emerald-300"
                              }`}
                            >
                              {s.status === "active" ? (
                                <>
                                  <PowerOff className="w-3.5 h-3.5 text-red-400" />
                                  <span>{t("sessions.disconnect", "Deactivate")}</span>
                                </>
                              ) : (
                                <>
                                  <Power className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>{t("sessions.reconnect", "Activate")}</span>
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (< md) */}
            <div className="md:hidden divide-y divide-gray-800/70">
              {sessions.map((s) => {
                const isBaileys = s.providerType === "baileys";
                return (
                  <div key={s.id} className="p-4 space-y-3 hover:bg-gray-850/40 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                          isBaileys
                            ? "bg-emerald-950/40 border-emerald-800/40 text-emerald-400"
                            : "bg-blue-950/40 border-blue-800/40 text-blue-400"
                        }`}>
                          {isBaileys ? <Smartphone className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-100 text-sm">{s.name}</h3>
                          <p className="text-[11px] text-gray-400">{configName(s.providerConfigId)}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <StatusBadge value={s.status} />
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                          {s.providerType}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 bg-gray-950/50 rounded-lg px-3 py-2 border border-gray-800/60 text-xs">
                      <code className="text-gray-400 font-mono truncate">{s.id}</code>
                      <button
                        onClick={() => copy(s.id, s.id)}
                        className="text-gray-400 hover:text-white transition-colors shrink-0"
                      >
                        {copied === s.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      {s.providerType === "baileys" && (
                        <button
                          onClick={() => openQrModal(s.providerConfigId)}
                          className="btn-secondary text-xs flex-1 justify-center py-2"
                        >
                          <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{t("provider_configs.qr_code", "QR Code")}</span>
                        </button>
                      )}
                      <button
                        onClick={() => void toggle(s)}
                        className={`text-xs py-2 px-3 flex-1 justify-center inline-flex items-center gap-1.5 rounded-lg border font-medium transition-colors ${
                          s.status === "active"
                            ? "bg-red-950/40 border-red-800/50 text-red-300 hover:bg-red-900/60"
                            : "bg-gray-800/60 border-gray-700/60 text-gray-300 hover:bg-emerald-950/40 hover:border-emerald-800/50 hover:text-emerald-300"
                        }`}
                      >
                        {s.status === "active" ? (
                          <>
                            <PowerOff className="w-3.5 h-3.5 text-red-400" />
                            <span>{t("sessions.disconnect", "Deactivate")}</span>
                          </>
                        ) : (
                          <>
                            <Power className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{t("sessions.reconnect", "Activate")}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}