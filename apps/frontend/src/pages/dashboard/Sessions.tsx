import { useEffect, useState, useMemo } from "react";
import {
  sessionsApi,
  Session,
  providerConfigsApi,
  ProviderConfig,
  aiBotApi,
  AiBotProfile,
} from "../../api/client";
import StatusBadge from "../../components/StatusBadge";
import EmptyState from "../../components/EmptyState";
import TablePagination from "../../components/TablePagination";
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
  Search,
  CheckCircle2,
  AlertCircle,
  Filter,
  Radio,
  Sparkles,
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
  const [aiProfiles, setAiProfiles] = useState<AiBotProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", providerConfigId: "", aiProfileId: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { copied, copy } = useCopy();

  // Quick AI Assign Modal
  const [assignModal, setAssignModal] = useState<{
    show: boolean;
    session: Session | null;
    selectedProfileId: string;
  }>({ show: false, session: null, selectedProfileId: "" });
  const [savingAssign, setSavingAssign] = useState(false);

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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
    const [s, c, p] = await Promise.all([
      sessionsApi.list(),
      providerConfigsApi.list(),
      aiBotApi.listProfiles(),
    ]);
    if (s.data) setSessions(s.data);
    if (c.data) setConfigs(c.data);
    if (p.data) setAiProfiles(p.data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const configName = (id: string) =>
    configs.find((c) => c.id === id)?.name ?? id.slice(0, 8) + "…";

  const getProfileForSession = (s: Session): AiBotProfile | undefined => {
    const profId = (s.metadata?.aiProfileId as string) || (s.metadata?.aiBotConfigId as string);
    if (profId) return aiProfiles.find((p) => p.id === profId);
    return aiProfiles.find((p) => p.targetSessionIds && p.targetSessionIds.includes(s.id));
  };

  // Top KPI Metrics
  const metrics = useMemo(() => {
    const total = sessions.length;
    const activeCount = sessions.filter((s) => s.status === "active").length;
    const inactiveCount = sessions.filter((s) => s.status !== "active").length;
    const baileysCount = sessions.filter((s) => s.providerType === "baileys").length;
    const aiAssignedCount = sessions.filter((s) => {
      const p = getProfileForSession(s);
      return p && p.isEnabled;
    }).length;
    return { total, activeCount, inactiveCount, baileysCount, aiAssignedCount };
  }, [sessions, aiProfiles]);

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const q = search.trim().toLowerCase();
      const cfgName = configName(s.providerConfigId).toLowerCase();
      const phone = (s.metadata?.phoneNumber || s.metadata?.phone || "") as string;
      const aiP = getProfileForSession(s);
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        cfgName.includes(q) ||
        (phone && phone.toLowerCase().includes(q)) ||
        (aiP && aiP.name.toLowerCase().includes(q));

      const matchesType =
        filterType === "all" ||
        (filterType === "baileys" && s.providerType === "baileys") ||
        (filterType === "meta" && s.providerType !== "baileys");

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && s.status === "active") ||
        (filterStatus === "inactive" && s.status !== "active");

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [sessions, search, filterType, filterStatus, configs, aiProfiles]);

  // Paginated sessions
  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage) || 1;
  const paginatedSessions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSessions.slice(start, start + itemsPerPage);
  }, [filteredSessions, currentPage, itemsPerPage]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  const handleTypeChange = (type: string) => {
    setFilterType(type);
    setCurrentPage(1);
  };

  const handleStatusChange = (status: string) => {
    setFilterStatus(status);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearch("");
    setFilterType("all");
    setFilterStatus("all");
    setCurrentPage(1);
  };

  const hasFilters = Boolean(search || filterType !== "all" || filterStatus !== "all");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await sessionsApi.create({
      name: form.name,
      providerConfigId: form.providerConfigId,
      aiProfileId: form.aiProfileId || undefined,
    });
    if (res.success) {
      setShowForm(false);
      setForm({ name: "", providerConfigId: "", aiProfileId: "" });
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

  const openAssignModal = (s: Session) => {
    const currentProf = getProfileForSession(s);
    setAssignModal({
      show: true,
      session: s,
      selectedProfileId: currentProf ? currentProf.id : "",
    });
  };

  const closeAssignModal = () => {
    setAssignModal({ show: false, session: null, selectedProfileId: "" });
  };

  const handleSaveAssignModal = async () => {
    if (!assignModal.session) return;
    setSavingAssign(true);
    try {
      const res = await sessionsApi.setAiProfile(
        assignModal.session.id,
        assignModal.selectedProfileId || null,
      );
      if (res.success) {
        closeAssignModal();
        await load();
      }
    } finally {
      setSavingAssign(false);
    }
  };

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
          {t("sessions.subtitle", "Daftar sesi akun WhatsApp aktif dan gateway yang terhubung")}
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
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary text-xs sm:text-sm shadow-lg shadow-brand-500/20"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{t("sessions.new_session", "Sesi Baru")}</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="card p-3 sm:p-4 bg-gray-900/60 border-gray-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-400 font-medium">Total Sesi</p>
            <p className="text-lg sm:text-xl font-bold text-white">{metrics.total}</p>
          </div>
        </div>

        <div className="card p-3 sm:p-4 bg-gray-900/60 border-gray-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-400 font-medium">Sesi Online</p>
            <p className="text-lg sm:text-xl font-bold text-emerald-400">{metrics.activeCount}</p>
          </div>
        </div>

        <div className="card p-3 sm:p-4 bg-gray-900/60 border-gray-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-400 font-medium">Sesi Offline</p>
            <p className="text-lg sm:text-xl font-bold text-amber-300">{metrics.inactiveCount}</p>
          </div>
        </div>

        <div className="card p-3 sm:p-4 bg-gray-900/60 border-gray-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-400 font-medium">AI Bot Aktif</p>
            <p className="text-lg sm:text-xl font-bold text-indigo-300">{metrics.aiAssignedCount}</p>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="card w-full max-w-md p-6 space-y-4 shadow-2xl border-gray-750">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <h2 className="text-base font-semibold text-white">
                {t("sessions.add_modal_title", "Tambah Sesi Baru")}
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
                <label className="label">{t("sessions.session_name", "Nama Sesi")} *</label>
                <input
                  className="input"
                  placeholder={t("sessions.session_name_placeholder", "Cth: CS Utama WhatsApp")}
                  required
                  minLength={3}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <label className="label">{t("sessions.provider", "Pilih Konfigurasi Provider")} *</label>
                <select
                  className="input"
                  required
                  value={form.providerConfigId}
                  onChange={(e) =>
                    setForm({ ...form, providerConfigId: e.target.value })
                  }
                >
                  <option value="">{t("sessions.select_provider_placeholder", "Pilih provider…")}</option>
                  {configs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.providerType}) {c.isActive ? "✓" : ""}
                    </option>
                  ))}
                </select>
                {configs.length === 0 && (
                  <p className="text-xs text-yellow-500 mt-1.5">
                    Belum ada konfigurasi provider. Silakan buat di menu Konfigurasi Provider terlebih dahulu.
                  </p>
                )}
              </div>

              {/* AI Profile Selector */}
              <div>
                <label className="label flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-gray-200">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Profil AI Bot (Opsional)</span>
                  </span>
                  <span className="text-[10px] text-gray-500">Bisa diubah kapan saja</span>
                </label>
                <select
                  className="input bg-gray-950/70 border-gray-700/80 focus:border-purple-500"
                  value={form.aiProfileId}
                  onChange={(e) => setForm({ ...form, aiProfileId: e.target.value })}
                >
                  <option value="">(Tanpa AI / Chat Manual Saja)</option>
                  {aiProfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.provider.toUpperCase()} - {p.model}) {p.isEnabled ? "✓ Aktif" : "(Nonaktif)"}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-400 mt-1">
                  Pilih aturan AI yang akan membalas otomatis pesan di nomor sesi ini.
                </p>
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
                  <span>{saving ? t("actions.saving", "Menyimpan…") : t("actions.create", "Buat Sesi")}</span>
                </button>
                <button
                  type="button"
                  className="btn-secondary py-2.5 px-4"
                  onClick={() => setShowForm(false)}
                >
                  {t("actions.cancel", "Batal")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick AI Assign Modal */}
      {assignModal.show && assignModal.session && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="card w-full max-w-md p-6 space-y-4 shadow-2xl border-gray-750">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Hubungkan Profil AI</h3>
                  <p className="text-xs text-gray-400">{assignModal.session.name}</p>
                </div>
              </div>
              <button
                onClick={closeAssignModal}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="label">Pilih Profil AI Bot untuk Sesi Ini:</label>
              <select
                className="input bg-gray-950 border-gray-700 focus:border-purple-500 text-xs py-2.5"
                value={assignModal.selectedProfileId}
                onChange={(e) =>
                  setAssignModal({ ...assignModal, selectedProfileId: e.target.value })
                }
              >
                <option value="">(Nonaktifkan AI / Balas Manual)</option>
                {aiProfiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.provider.toUpperCase()} - {p.model}) {p.isEnabled ? "✓ Aktif" : "(Nonaktif)"}
                  </option>
                ))}
              </select>
              <div className="p-3 bg-purple-950/30 border border-purple-800/40 rounded-xl text-xs text-purple-300 leading-relaxed">
                Nomor ini akan otomatis menggunakan System Prompt, Knowledge Base FAQ, dan Model AI sesuai profil yang dipilih.
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => void handleSaveAssignModal()}
                disabled={savingAssign}
                className="btn-primary flex-1 justify-center py-2.5 text-xs font-semibold shadow-lg shadow-brand-500/20"
              >
                {savingAssign ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Simpan Pengaturan AI</span>
              </button>
              <button onClick={closeAssignModal} className="btn-secondary py-2.5 px-4 text-xs">
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      {sessions.length > 0 && (
        <div className="card p-3 sm:p-4 bg-gray-900/40 border-gray-800 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Cari sesi, ID, nomor, atau profil AI..."
                className="input pl-9 pr-8 text-xs py-2 w-full bg-gray-950/60 border-gray-800 focus:border-brand-500"
              />
              {search && (
                <button
                  onClick={() => handleSearchChange("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <div className="flex items-center bg-gray-950/70 p-1 rounded-lg border border-gray-800 text-xs">
                <button
                  onClick={() => handleTypeChange("all")}
                  className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                    filterType === "all"
                      ? "bg-gray-800 text-white shadow-sm"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  Semua Tipe
                </button>
                <button
                  onClick={() => handleTypeChange("baileys")}
                  className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                    filterType === "baileys"
                      ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800/40 shadow-sm"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  Baileys
                </button>
                <button
                  onClick={() => handleTypeChange("meta")}
                  className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                    filterType === "meta"
                      ? "bg-blue-950/80 text-blue-300 border border-blue-800/40 shadow-sm"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  Meta API
                </button>
              </div>

              <div className="flex items-center bg-gray-950/70 p-1 rounded-lg border border-gray-800 text-xs">
                <button
                  onClick={() => handleStatusChange("all")}
                  className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                    filterStatus === "all"
                      ? "bg-gray-800 text-white shadow-sm"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  Semua Status
                </button>
                <button
                  onClick={() => handleStatusChange("active")}
                  className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                    filterStatus === "active"
                      ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800/40 shadow-sm"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  Online
                </button>
                <button
                  onClick={() => handleStatusChange("inactive")}
                  className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                    filterStatus === "inactive"
                      ? "bg-gray-800 text-gray-300 shadow-sm"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  Offline
                </button>
              </div>

              {hasFilters && (
                <button
                  onClick={resetFilters}
                  className="px-2.5 py-1 text-xs text-brand-400 hover:text-brand-300 transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
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
            title={t("sessions.title", "Belum Ada Sesi")}
            description={t(
              "sessions.empty",
              "Buat sesi baru untuk menghubungkan konfigurasi provider ke akun WhatsApp Anda."
            )}
            action={
              <button
                className="btn-primary shadow-lg shadow-brand-500/20"
                onClick={() => setShowForm(true)}
              >
                <Plus className="w-4 h-4" />
                <span>{t("sessions.new_session", "Buat Sesi Baru")}</span>
              </button>
            }
          />
        ) : filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 px-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-800/60 border border-gray-700/60 flex items-center justify-center text-gray-400">
              <Filter className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-200">Tidak ada sesi yang cocok</p>
              <p className="text-xs text-gray-400 max-w-sm">
                Tidak ada data sesi WhatsApp yang memenuhi kriteria pencarian atau filter yang dipilih.
              </p>
            </div>
            <button
              onClick={resetFilters}
              className="btn-secondary text-xs px-3 py-1.5 mt-1"
            >
              Reset Filter Pencarian
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table (md+) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-900/60">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {t("contacts.name", "Nama Sesi")}
                    </th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Session ID
                    </th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {t("sessions.provider", "Gateway")}
                    </th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Profil AI Bot
                    </th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {t("sessions.status", "Status")}
                    </th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {t("sessions.created_at", "Dibuat")}
                    </th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {t("provider_configs.actions", "Aksi")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {paginatedSessions.map((s) => {
                    const isBaileys = s.providerType === "baileys";
                    const aiProfile = getProfileForSession(s);

                    return (
                      <tr key={s.id} className="hover:bg-gray-850/50 transition-colors group">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                                isBaileys
                                  ? "bg-emerald-950/40 border-emerald-800/40 text-emerald-400 group-hover:border-emerald-500/50"
                                  : "bg-blue-950/40 border-blue-800/40 text-blue-400 group-hover:border-blue-500/50"
                              }`}
                            >
                              {isBaileys ? <Smartphone className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                            </div>
                            <div>
                              <span className="font-semibold text-gray-100 group-hover:text-white transition-colors block">
                                {s.name}
                              </span>
                              {Boolean(s.metadata?.phoneNumber || s.metadata?.phone) && (
                                <span className="text-[11px] text-emerald-400/80 font-mono">
                                  +{(s.metadata?.phoneNumber || s.metadata?.phone) as string}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <code className="text-xs text-gray-400 font-mono bg-gray-950/60 border border-gray-800/60 px-2 py-0.5 rounded truncate max-w-[130px]">
                              {s.id}
                            </code>
                            <button
                              onClick={() => copy(s.id, s.id)}
                              className="text-gray-500 hover:text-gray-300 transition-colors shrink-0 p-1 hover:bg-gray-800 rounded"
                              title={t("actions.copy", "Salin Session ID")}
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
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              isBaileys
                                ? "bg-emerald-950/50 text-emerald-300 border-emerald-800/50"
                                : "bg-blue-950/50 text-blue-300 border-blue-800/50"
                            }`}
                          >
                            {isBaileys ? <Radio className="w-3 h-3 text-emerald-400" /> : <Globe className="w-3 h-3 text-blue-400" />}
                            {isBaileys ? "Baileys MD" : s.providerType.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {aiProfile ? (
                            <button
                              onClick={() => openAssignModal(s)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-950/60 border border-purple-800/60 text-purple-300 hover:border-purple-500 transition-colors"
                              title="Klik untuk mengubah profil AI bot"
                            >
                              <Sparkles className="w-3 h-3 text-purple-400" />
                              <span className="truncate max-w-[130px]">{aiProfile.name}</span>
                              {aiProfile.isEnabled ? (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => openAssignModal(s)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs text-gray-500 hover:text-gray-300 bg-gray-950/50 border border-gray-800/80 hover:border-gray-700 transition-colors"
                              title="Klik untuk memilih profil AI bot"
                            >
                              <span>Tanpa AI</span>
                            </button>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge value={s.status} />
                        </td>
                        <td className="px-5 py-4 text-gray-400 text-xs">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                            {new Date(s.createdAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openAssignModal(s)}
                              className="btn-secondary text-xs px-2.5 py-1.5 hover:border-purple-500/50 hover:text-purple-300"
                              title="Atur Profil AI untuk nomor ini"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                              <span>Profil AI</span>
                            </button>
                            {s.providerType === "baileys" && (
                              <button
                                onClick={() => openQrModal(s.providerConfigId)}
                                className="btn-secondary text-xs px-2.5 py-1.5 hover:border-emerald-500/50 hover:text-emerald-300"
                                title={t("sessions.scan_qr", "Hubungkan WhatsApp / Scan QR")}
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
                                  <span>{t("sessions.disconnect", "Nonaktifkan")}</span>
                                </>
                              ) : (
                                <>
                                  <Power className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>{t("sessions.reconnect", "Aktifkan")}</span>
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
              {paginatedSessions.map((s) => {
                const isBaileys = s.providerType === "baileys";
                const aiProfile = getProfileForSession(s);

                return (
                  <div key={s.id} className="p-4 space-y-3 hover:bg-gray-850/40 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                            isBaileys
                              ? "bg-emerald-950/40 border-emerald-800/40 text-emerald-400"
                              : "bg-blue-950/40 border-blue-800/40 text-blue-400"
                          }`}
                        >
                          {isBaileys ? <Smartphone className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-100 text-sm leading-snug">{s.name}</h3>
                          <p className="text-[11px] text-gray-400">{configName(s.providerConfigId)}</p>
                          {Boolean(s.metadata?.phoneNumber || s.metadata?.phone) && (
                            <p className="text-[10px] text-emerald-400/80 font-mono">
                              +{(s.metadata?.phoneNumber || s.metadata?.phone) as string}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <StatusBadge value={s.status} />
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase tracking-wider border ${
                            isBaileys
                              ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/40"
                              : "bg-blue-950/40 text-blue-300 border-blue-800/40"
                          }`}
                        >
                          {s.providerType}
                        </span>
                      </div>
                    </div>

                    {/* AI Profile Pill in Mobile */}
                    <div className="flex items-center justify-between gap-2 p-2.5 bg-gray-950/40 rounded-xl border border-gray-800/60 text-xs">
                      <span className="text-gray-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span>Profil AI:</span>
                      </span>
                      {aiProfile ? (
                        <button
                          onClick={() => openAssignModal(s)}
                          className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-950/80 border border-purple-800/60 text-purple-300 truncate max-w-[160px]"
                        >
                          {aiProfile.name}
                        </button>
                      ) : (
                        <button
                          onClick={() => openAssignModal(s)}
                          className="px-2 py-0.5 rounded-full text-xs text-gray-500 bg-gray-900 border border-gray-800"
                        >
                          Pilih Profil AI
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 bg-gray-950/60 rounded-xl px-3 py-2 border border-gray-800/60 text-xs">
                      <code className="text-gray-400 font-mono truncate">{s.id}</code>
                      <button
                        onClick={() => copy(s.id, s.id)}
                        className="text-gray-400 hover:text-white transition-colors shrink-0 p-1"
                        title={t("actions.copy", "Salin Session ID")}
                      >
                        {copied === s.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => openAssignModal(s)}
                        className="btn-secondary text-xs flex-1 justify-center py-2 hover:border-purple-500/50 hover:text-purple-300"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span>Profil AI</span>
                      </button>
                      {s.providerType === "baileys" && (
                        <button
                          onClick={() => openQrModal(s.providerConfigId)}
                          className="btn-secondary text-xs flex-1 justify-center py-2 hover:border-emerald-500/50 hover:text-emerald-300"
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
                            <span>{t("sessions.disconnect", "Nonaktifkan")}</span>
                          </>
                        ) : (
                          <>
                            <Power className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{t("sessions.reconnect", "Aktifkan")}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Component */}
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredSessions.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(num) => {
                setItemsPerPage(num);
                setCurrentPage(1);
              }}
              itemsPerPageOptions={[5, 10, 25, 50]}
            />
          </>
        )}
      </div>
    </div>
  );
}
