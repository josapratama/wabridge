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
    <div className="p-6 space-y-5">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-gray-400">
          {t("provider_configs.subtitle", "Configure WhatsApp connectivity via Meta Cloud API, BSP partner, or Baileys Web.")}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void load()}
            className="btn-secondary"
            disabled={loading}
            title={t("actions.refresh", "Refresh")}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={() => setShowForm(true)} className="btn-primary shadow-lg shadow-brand-500/20">
            <Plus className="w-4 h-4" /> {t("provider_configs.new", "New Provider Config")}
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
            title={t("provider_configs.empty_title", "No provider configs yet")}
            description={t("provider_configs.empty_desc", "Create your first provider configuration to connect WhatsApp.")}
            action={
              <button className="btn-primary shadow-lg shadow-brand-500/20" onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4" /> {t("provider_configs.new", "New Provider Config")}
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
