import { useState } from "react";
import { ProviderConfig } from "../../api/client";
import EmptyState from "../../components/EmptyState";
import BaileysConnectionModal from "../../components/BaileysConnectionModal";
import { Settings2, Plus, RefreshCw } from "lucide-react";
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
    openQrModal,
    closeQrModal,
    generateQrCode,
    requestPairingCode,
  } = useProviderConfigs();
  const [showForm, setShowForm] = useState(false);

  const handleCreate = async (form: Partial<ProviderConfig>) => {
    const res = await create(form);
    if (res.success) setShowForm(false);
    return res;
  };

  return (
    <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-5">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-xs sm:text-sm text-gray-400">
          {t("provider_configs.subtitle", "Kelola gateway koneksi WhatsApp (Meta Cloud API, BSP Partner, dan Baileys Multi-Device)")}
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
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {t("provider_configs.new", "Tambah Provider")}
          </button>
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
      />

      {/* Create form */}
      {showForm && (
        <ProviderConfigForm
          onSubmit={handleCreate}
          onClose={() => setShowForm(false)}
        />
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
            title={t("provider_configs.empty_title", "Belum Ada Provider")}
            description={t("provider_configs.empty_desc", "Tambahkan konfigurasi Baileys atau Meta Cloud API untuk mulai menghubungkan nomor WhatsApp.")}
            action={
              <button className="btn-primary text-xs sm:text-sm shadow-lg shadow-brand-500/20" onClick={() => setShowForm(true)}>
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {t("provider_configs.new", "Tambah Provider")}
              </button>
            }
          />
        ) : (
          <ProviderConfigTable
            configs={configs}
            onToggle={(cfg) => void toggle(cfg)}
            onShowQr={openQrModal}
          />
        )}
      </div>
    </div>
  );
}
