import { useState, useEffect } from "react";
import EmptyState from "../../components/EmptyState";
import {
  Webhook,
  Plus,
  RefreshCw,
  Trash2,
  Activity,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Eye,
  AlertCircle,
  X,
} from "lucide-react";
import { useWebhooks } from "../../features/webhooks/hooks/useWebhooks";
import WebhookForm from "../../features/webhooks/components/WebhookForm";
import WebhookLogsModal from "../../features/webhooks/components/WebhookLogsModal";
import WebhookTable from "../../features/webhooks/components/WebhookTable";
import { webhookEndpointsApi, WebhookLog } from "../../api/client";

export default function Webhooks() {
  const [activeTab, setActiveTab] = useState<"endpoints" | "logs">("endpoints");

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

  // Delivery Logs & Retry state
  const [allLogs, setAllLogs] = useState<WebhookLog[]>([]);
  const [allLogsLoading, setAllLogsLoading] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);
  const [viewLogDetail, setViewLogDetail] = useState<WebhookLog | null>(null);

  const loadAllLogs = async () => {
    setAllLogsLoading(true);
    try {
      const res = await webhookEndpointsApi.getAllLogs();
      if (res.data) setAllLogs(res.data);
    } catch (e) {
      console.error("Failed to load all logs", e);
    } finally {
      setAllLogsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "logs") {
      void loadAllLogs();
    }
  }, [activeTab]);

  const handleRetry = async (logId: string) => {
    setRetryingId(logId);
    setRetryMessage(null);
    try {
      const res = await webhookEndpointsApi.retryLog(logId);
      if (res.data) {
        setRetryMessage("Webhook redelivery attempt dispatched!");
        setTimeout(() => {
          void loadAllLogs();
          setRetryMessage(null);
        }, 1500);
      }
    } catch (err: unknown) {
      setRetryMessage("Failed to retry webhook.");
    } finally {
      setRetryingId(null);
    }
  };

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
      {/* Action Bar & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("endpoints")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === "endpoints"
                ? "bg-brand-600/20 text-brand-400 border border-brand-500/30"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            <Webhook className="w-4 h-4" />
            <span>Webhook Endpoints ({endpoints.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === "logs"
                ? "bg-brand-600/20 text-brand-400 border border-brand-500/30"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Delivery Logs & Dead-Letter</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => (activeTab === "endpoints" ? void load() : void loadAllLogs())}
            className="btn-secondary"
            disabled={loading || allLogsLoading}
          >
            <RefreshCw
              className={`w-4 h-4 ${
                loading || allLogsLoading ? "animate-spin" : ""
              }`}
            />
          </button>
          {activeTab === "endpoints" && (
            <button onClick={() => setShowForm(true)} className="btn-primary">
              <Plus className="w-4 h-4" /> New Endpoint
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: Webhook Endpoints */}
      {activeTab === "endpoints" && (
        <>
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
                  <button
                    className="btn-primary"
                    onClick={() => setShowForm(true)}
                  >
                    <Plus className="w-4 h-4" /> New Endpoint
                  </button>
                }
              />
            ) : (
              <WebhookTable
                endpoints={endpoints}
                onLogs={(id) => void openLogs(id)}
                onToggle={(ep) => void toggleActive(ep)}
                onTest={async (id) => {
                  const res = await webhookEndpointsApi.test(id);
                  if (res.data) return res.data;
                  throw new Error(res.message || "Failed");
                }}
                onDelete={setDeleteId}
              />
            )}
          </div>
        </>
      )}

      {/* Tab 2: Delivery Logs & Dead Letter */}
      {activeTab === "logs" && (
        <div className="space-y-4">
          {retryMessage && (
            <div className="p-3 rounded-xl bg-brand-950/60 border border-brand-800/60 text-xs text-brand-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{retryMessage}</span>
            </div>
          )}

          <div className="card overflow-hidden">
            {allLogsLoading ? (
              <div className="flex items-center justify-center py-20">
                <RefreshCw className="w-6 h-6 text-brand-500 animate-spin" />
              </div>
            ) : allLogs.length === 0 ? (
              <div className="p-12 text-center text-gray-500 text-xs">
                No delivery logs recorded yet. Events will show here as they are dispatched.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-900 border-b border-gray-800 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Event Type</th>
                      <th className="px-4 py-3">Response Code</th>
                      <th className="px-4 py-3">Duration</th>
                      <th className="px-4 py-3">Attempt</th>
                      <th className="px-4 py-3">Timestamp</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {allLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-800/40">
                        <td className="px-4 py-3">
                          {log.success ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-950 border border-brand-800 text-brand-400">
                              <CheckCircle2 className="w-3 h-3" /> 2xx Delivered
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-950 border border-red-800 text-red-400">
                              <XCircle className="w-3 h-3" /> Failed
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono font-medium text-gray-200">
                          {log.eventType}
                        </td>
                        <td className="px-4 py-3 font-mono">
                          {log.responseStatus ? (
                            <span
                              className={
                                log.responseStatus < 400
                                  ? "text-brand-400"
                                  : "text-red-400"
                              }
                            >
                              {log.responseStatus}
                            </span>
                          ) : (
                            <span className="text-gray-500">Timeout / Error</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-400 font-mono">
                          {log.durationMs != null ? `${log.durationMs}ms` : "-"}
                        </td>
                        <td className="px-4 py-3 text-gray-400 font-mono">
                          #{log.attempt}
                        </td>
                        <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setViewLogDetail(log)}
                              className="btn-secondary text-[10px] py-1 px-2 flex items-center gap-1"
                              title="Inspect payload"
                            >
                              <Eye className="w-3 h-3" /> Inspect
                            </button>
                            {!log.success && (
                              <button
                                onClick={() => void handleRetry(log.id)}
                                disabled={retryingId === log.id}
                                className="btn-primary text-[10px] py-1 px-2.5 flex items-center gap-1"
                                title="Resend webhook immediately"
                              >
                                <RotateCcw
                                  className={`w-3 h-3 ${
                                    retryingId === log.id ? "animate-spin" : ""
                                  }`}
                                />
                                <span>Retry</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inspect Log Detail Modal */}
      {viewLogDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-brand-400" />
                  Webhook Payload & Response
                </h3>
                <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                  Event: {viewLogDetail.eventType} (Log ID: {viewLogDetail.id})
                </p>
              </div>
              <button
                onClick={() => setViewLogDetail(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-gray-300 mb-1">
                  Dispatched Payload (JSON)
                </p>
                <pre className="p-3 rounded-lg bg-gray-950 border border-gray-800 text-[11px] font-mono text-brand-300 max-h-48 overflow-y-auto">
                  {JSON.stringify(viewLogDetail.payload, null, 2)}
                </pre>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-300 mb-1">
                  Server Response ({viewLogDetail.responseStatus || "No response"})
                </p>
                <pre className="p-3 rounded-lg bg-gray-950 border border-gray-800 text-[11px] font-mono text-gray-300 max-h-36 overflow-y-auto">
                  {viewLogDetail.responseBody || "(empty)"}
                </pre>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              {!viewLogDetail.success ? (
                <button
                  onClick={() => {
                    void handleRetry(viewLogDetail.id);
                    setViewLogDetail(null);
                  }}
                  className="btn-primary text-xs flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry Delivery Now</span>
                </button>
              ) : (
                <div />
              )}
              <button
                onClick={() => setViewLogDetail(null)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
