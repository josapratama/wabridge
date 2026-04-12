import { useState } from "react";
import { ApiKey } from "../../api/client";
import EmptyState from "../../components/EmptyState";
import { Key, Plus, RefreshCw, ShieldCheck } from "lucide-react";
import { useApiKeys } from "../../features/api-keys/hooks/useApiKeys";
import ApiKeyRow from "../../features/api-keys/components/ApiKeyRow";
import {
  NewKeyModal,
  CreateKeyModal,
  RevokeModal,
} from "../../features/api-keys/components/ApiKeyModals";

export default function ApiKeys() {
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
    <div className="p-6 space-y-5">
      {/* Header */}
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
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> New API Key
          </button>
        </div>
      </div>

      {/* Info banner */}
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
            title="No API keys"
            description="Create an API key to start sending messages from your application."
            action={
              <button
                className="btn-primary"
                onClick={() => setShowCreate(true)}
              >
                <Plus className="w-4 h-4" /> New API Key
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
