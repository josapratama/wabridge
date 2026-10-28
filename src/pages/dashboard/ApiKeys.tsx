import { useState } from "react";
import { ApiKey } from "../../api/client";
import EmptyState from "../../components/EmptyState";
import { Key, Plus, RefreshCw } from "lucide-react";
import { useApiKeys } from "../../features/api-keys/hooks/useApiKeys";
import ApiKeyRow from "../../features/api-keys/components/ApiKeyRow";
import {
  NewKeyModal,
  CreateKeyModal,
  RevokeModal,
} from "../../features/api-keys/components/ApiKeyModals";
import DeveloperUsageGuide from "../../features/api-keys/components/DeveloperUsageGuide";
import { useI18n } from "../../context/I18nContext";

export default function ApiKeys() {
  const { t } = useI18n();
  const { keys, loading, load, create, revoke, fmt, isExpired } = useApiKeys();
  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState<ApiKey | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);

  const handleCreate = async (name: string, expiresAt?: string) => {
    const res = await create(name, expiresAt);
    if (res.success && res.data) {
      setNewKey(res.data);
      setShowCreate(false);
    }
    return res;
  };

  const handleRevoke = async (id: string) => {
    await revoke(id);
    setRevokeId(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-white">{t("apikeys.title", "API Keys & Integrasi")}</h1>
          <p className="text-xs sm:text-sm text-gray-400">
            {t("apikeys.subtitle", "Kelola token autentikasi untuk mengakses REST API WhatsApp Gateway secara programatik")}
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
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> {t("apikeys.create_key", "New API Key")}
          </button>
        </div>
      </div>

      {/* Developer Interactive Code Snippets & Quickstart */}
      <DeveloperUsageGuide keys={keys} />

      {/* Modals */}
      {newKey && (
        <NewKeyModal apiKey={newKey} onClose={() => setNewKey(null)} />
      )}
      {showCreate && (
        <CreateKeyModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}
      {revokeId && (
        <RevokeModal
          onConfirm={() => void handleRevoke(revokeId)}
          onCancel={() => setRevokeId(null)}
        />
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
            title={t("apikeys.empty", "No API keys")}
            description={t("apikeys.subtitle", "Create an API key to start sending messages from your application.")}
            action={
              <button
                className="btn-primary"
                onClick={() => setShowCreate(true)}
              >
                <Plus className="w-4 h-4" /> {t("apikeys.create_key", "New API Key")}
              </button>
            }
          />
        ) : (
          <div className="divide-y divide-gray-800">
            {keys.map((k) => (
              <ApiKeyRow
                key={k.id}
                apiKey={k}
                onRevoke={setRevokeId}
                fmt={fmt}
                isExpired={isExpired}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
