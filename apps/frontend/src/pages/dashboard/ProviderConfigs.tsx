import { useState, useMemo } from "react";
import { ProviderConfig } from "../../api/client";
import EmptyState from "../../components/EmptyState";
import BaileysConnectionModal from "../../components/BaileysConnectionModal";
import TablePagination from "../../components/TablePagination";
import {
  Settings2,
  Plus,
  RefreshCw,
  Search,
  X,
  Smartphone,
  Globe,
  CheckCircle2,
  Filter,
} from "lucide-react";
import { useI18n } from "../../context/I18nContext";
import { useProviderConfigs } from "../../features/provider-configs/hooks/useProviderConfigs";
import ProviderConfigForm from "../../features/provider-configs/components/ProviderConfigForm";
import ProviderConfigTable from "../../features/provider-configs/components/ProviderConfigTable";

export default function ProviderConfigs() {
  const { t } = useI18n();
  const {
    configs,
    loading,
    load,
    create,
    toggle,
    qrModal,
    qrLoading,
    pairingLoading,
    openQrModal,
    closeQrModal,
    generateQrCode,
    requestPairingCode,
  } = useProviderConfigs();

  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Top KPI Metrics
  const metrics = useMemo(() => {
    const total = configs.length;
    const baileysCount = configs.filter((c) => c.providerType === "baileys").length;
    const metaCount = configs.filter((c) => c.providerType === "meta-cloud" || c.providerType === "bsp").length;
    const activeCount = configs.filter((c) => c.isActive).length;
    return { total, baileysCount, metaCount, activeCount };
  }, [configs]);

  // Filtered configs
  const filteredConfigs = useMemo(() => {
    return configs.filter((cfg) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        cfg.name.toLowerCase().includes(q) ||
        cfg.id.toLowerCase().includes(q) ||
        (cfg.baseUrl && cfg.baseUrl.toLowerCase().includes(q));

      const matchesType =
        filterType === "all" ||
        (filterType === "baileys" && cfg.providerType === "baileys") ||
        (filterType === "meta" && (cfg.providerType === "meta-cloud" || cfg.providerType === "bsp"));

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && cfg.isActive) ||
        (filterStatus === "inactive" && !cfg.isActive);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [configs, search, filterType, filterStatus]);

  // Paginated configs
  const totalPages = Math.ceil(filteredConfigs.length / itemsPerPage) || 1;
  const paginatedConfigs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredConfigs.slice(start, start + itemsPerPage);
  }, [filteredConfigs, currentPage, itemsPerPage]);

  const handleCreate = async (form: Partial<ProviderConfig>) => {
    const res = await create(form);
    if (res.success) setShowForm(false);
    return res;
  };

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

  return (
    <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-5">
      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-xs sm:text-sm text-gray-400">
          {t(
            "provider_configs.subtitle",
            "Kelola gateway koneksi WhatsApp (Meta Cloud API, BSP Partner, dan Baileys Multi-Device)"
          )}
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
            <span>{t("provider_configs.new", "Tambah Provider")}</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="card p-3 sm:p-4 bg-gray-900/60 border-gray-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
            <Settings2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-400 font-medium">Total Gateway</p>
            <p className="text-lg sm:text-xl font-bold text-white">{metrics.total}</p>
          </div>
        </div>

        <div className="card p-3 sm:p-4 bg-gray-900/60 border-gray-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-400 font-medium">Baileys MD</p>
            <p className="text-lg sm:text-xl font-bold text-white">{metrics.baileysCount}</p>
          </div>
        </div>

        <div className="card p-3 sm:p-4 bg-gray-900/60 border-gray-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-400 font-medium">Meta Cloud API</p>
            <p className="text-lg sm:text-xl font-bold text-white">{metrics.metaCount}</p>
          </div>
        </div>

        <div className="card p-3 sm:p-4 bg-gray-900/60 border-gray-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-400 font-medium">Provider Aktif</p>
            <p className="text-lg sm:text-xl font-bold text-emerald-400">{metrics.activeCount}</p>
          </div>
        </div>
      </div>

      {/* Baileys QR Modal */}
      <BaileysConnectionModal
        show={qrModal.show}
        configId={qrModal.configId}
        onClose={closeQrModal}
        onRequestQrCode={generateQrCode}
        onRequestPairingCode={requestPairingCode}
        qrCode={qrModal.qrCode}
        pairingCode={qrModal.pairingCode}
        loading={qrLoading}
        pairingLoading={pairingLoading}
        isConnected={qrModal.isConnected}
      />

      {/* Create form */}
      {showForm && (
        <ProviderConfigForm
          onSubmit={handleCreate}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Filter & Search Bar */}
      {configs.length > 0 && (
        <div className="card p-3 sm:p-4 bg-gray-900/40 border-gray-800 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Cari berdasarkan nama, ID, atau endpoint..."
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
                  Aktif
                </button>
                <button
                  onClick={() => handleStatusChange("inactive")}
                  className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                    filterStatus === "inactive"
                      ? "bg-gray-800 text-gray-300 shadow-sm"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  Nonaktif
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

      {/* Table Container */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-5 h-5 text-gray-500 animate-spin" />
          </div>
        ) : configs.length === 0 ? (
          <EmptyState
            icon={Settings2}
            title={t("provider_configs.empty_title", "Belum Ada Provider")}
            description={t(
              "provider_configs.empty_desc",
              "Tambahkan konfigurasi Baileys atau Meta Cloud API untuk mulai menghubungkan nomor WhatsApp."
            )}
            action={
              <button
                className="btn-primary text-xs sm:text-sm shadow-lg shadow-brand-500/20"
                onClick={() => setShowForm(true)}
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{t("provider_configs.new", "Tambah Provider")}</span>
              </button>
            }
          />
        ) : filteredConfigs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 px-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-800/60 border border-gray-700/60 flex items-center justify-center text-gray-400">
              <Filter className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-200">Tidak ada provider yang cocok</p>
              <p className="text-xs text-gray-400 max-w-sm">
                Tidak ada data provider yang memenuhi kriteria pencarian atau filter yang dipilih.
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
            <ProviderConfigTable
              configs={paginatedConfigs}
              onToggle={(cfg) => void toggle(cfg)}
              onShowQr={openQrModal}
            />

            {/* Pagination Component */}
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredConfigs.length}
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
