import { useState } from "react";
import EmptyState from "../../components/EmptyState";
import { Webhook, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useWebhooks } from "../../features/webhooks/hooks/useWebhooks";
import WebhookForm from "../../features/webhooks/components/WebhookForm";
import WebhookLogsModal from "../../features/webhooks/components/WebhookLogsModal";
import WebhookTable from "../../features/webhooks/components/WebhookTable";

export default function Webhooks() {
  const {
    endpoints,
    loading,
    load,
    create,
    toggleActive,
    remove,
    logs,
    logsLoading,
    fetchLogs,
  } = useWebhooks();
  const [showForm, setShowForm] = useState(false);
  const [logsFor, setLogsFor] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCreate = async (form: {
    name: string;
    url: string;
    secret?: string;
    events: string[];
  }) => {
    const res = await create(form);
    if (res.success) setShowForm(false);
    return res;
  };

  const openLogs = async (id: string) => {
    setLogsFor(id);
    await fetchLogs(id);
  };

  const handleDelete = async (id: string) => {
    await remove(id);
    setDeleteId(null);
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Webhook className="w-5 h-5 text-brand-400" />
            Webhook Endpoints
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Receive real-time events to your server
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
            <Plus className="w-4 h-4" /> New Endpoint
          </button>
        </div>
      </div>

      {/* Modals */}
      {showForm && (
        <WebhookForm
          onSubmit={handleCreate}
          onClose={() => setShowForm(false)}
        />
      )}
      {logsFor && (
        <WebhookLogsModal
          logs={logs}
          loading={logsLoading}
          onClose={() => setLogsFor(null)}
        />
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="card w-full max-w-sm p-6 space-y-4">
            <p className="text-sm font-semibold text-white">Delete Webhook?</p>
            <p className="text-xs text-gray-400">
              This will also delete all logs for this endpoint.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => void handleDelete(deleteId)}
                className="btn-danger flex-1 justify-center"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
              <button
                onClick={() => setDeleteId(null)}
                className="btn-secondary flex-1 justify-center"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-5 h-5 text-gray-500 animate-spin" />
          </div>
        ) : endpoints.length === 0 ? (
          <EmptyState
            icon={Webhook}
            title="No webhook endpoints"
            description="Add an endpoint to receive real-time events from your WhatsApp sessions."
            action={
              <button className="btn-primary" onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4" /> New Endpoint
              </button>
            }
          />
        ) : (
          <WebhookTable
            endpoints={endpoints}
            onLogs={(id) => void openLogs(id)}
            onToggle={(ep) => void toggleActive(ep)}
            onDelete={setDeleteId}
          />
        )}
      </div>
    </div>
  );
}
