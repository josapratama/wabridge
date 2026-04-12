import { useEffect, useState } from "react";
import {
  webhookEndpointsApi,
  WebhookEndpoint,
  WebhookLog,
} from "../../api/client";
import EmptyState from "../../components/EmptyState";
import StatusBadge from "../../components/StatusBadge";
import {
  Webhook,
  Plus,
  X,
  Check,
  RefreshCw,
  Trash2,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Clock,
  Zap,
} from "lucide-react";

const ALL_EVENTS = [
  "message.received",
  "message.sent",
  "message.delivered",
  "message.read",
  "message.failed",
  "session.connected",
  "session.disconnected",
];

export default function Webhooks() {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    url: "",
    secret: "",
    events: [] as string[],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [logsFor, setLogsFor] = useState<string | null>(null);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await webhookEndpointsApi.list();
    if (res.data) setEndpoints(res.data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const toggleEvent = (ev: string) =>
    setForm((f) => ({
      ...f,
      events: f.events.includes(ev)
        ? f.events.filter((e) => e !== ev)
        : [...f.events, ev],
    }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.events.length === 0) {
      setError("Select at least one event");
      return;
    }
    setSaving(true);
    setError("");
    const res = await webhookEndpointsApi.create({
      name: form.name,
      url: form.url,
      secret: form.secret || undefined,
      events: form.events,
    });
    if (res.success) {
      setShowForm(false);
      setForm({ name: "", url: "", secret: "", events: [] });
      await load();
    } else {
      setError(res.message);
    }
    setSaving(false);
  };

  const toggleActive = async (ep: WebhookEndpoint) => {
    await webhookEndpointsApi.update(ep.id, { isActive: !ep.isActive });
    await load();
  };

  const handleDelete = async (id: string) => {
    await webhookEndpointsApi.delete(id);
    setDeleteId(null);
    await load();
  };

  const openLogs = async (id: string) => {
    setLogsFor(id);
    setLogsLoading(true);
    const res = await webhookEndpointsApi.getLogs(id);
    if (res.data) setLogs(res.data);
    setLogsLoading(false);
  };

  return (
    <div className="p-6 space-y-5">
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

      {/* Create modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">
                New Webhook Endpoint
              </p>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {error && (
              <div className="px-3 py-2 bg-red-900/30 border border-red-800/50 rounded-lg text-xs text-red-300">
                {error}
              </div>
            )}
            <form onSubmit={(e) => void handleCreate(e)} className="space-y-3">
              <div>
                <label className="label">Name *</label>
                <input
                  className="input"
                  placeholder="e.g. My App Webhook"
                  required
                  minLength={3}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="label">URL *</label>
                <input
                  className="input"
                  type="url"
                  placeholder="https://myapp.com/webhook"
                  required
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Secret (optional)</label>
                <input
                  className="input"
                  placeholder="Used for HMAC-SHA256 signature verification"
                  value={form.secret}
                  onChange={(e) => setForm({ ...form, secret: e.target.value })}
                />
                <p className="text-xs text-gray-600 mt-1">
                  Sent as X-Webhook-Signature header
                </p>
              </div>
              <div>
                <label className="label">Events *</label>
                <div className="grid grid-cols-2 gap-1.5 mt-1">
                  {ALL_EVENTS.map((ev) => (
                    <button
                      key={ev}
                      type="button"
                      onClick={() => toggleEvent(ev)}
                      className={`text-left px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors border ${
                        form.events.includes(ev)
                          ? "bg-brand-600/20 border-brand-700/50 text-brand-300"
                          : "bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200"
                      }`}
                    >
                      {form.events.includes(ev) ? "✓ " : ""}
                      {ev}
                    </button>
                  ))}
                </div>
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
                  {saving ? "Creating…" : "Create"}
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

      {/* Logs modal */}
      {logsFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="card w-full max-w-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <p className="text-sm font-semibold text-white">Delivery Logs</p>
              <button
                onClick={() => setLogsFor(null)}
                className="text-gray-500 hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              {logsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <RefreshCw className="w-5 h-5 text-gray-500 animate-spin" />
                </div>
              ) : logs.length === 0 ? (
                <p className="text-center text-sm text-gray-600 py-16">
                  No logs yet
                </p>
              ) : (
                <div className="divide-y divide-gray-800">
                  {logs.map((log) => (
                    <div key={log.id} className="px-5 py-3 space-y-1">
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${log.success ? "bg-brand-400" : "bg-red-400"}`}
                        />
                        <code className="text-xs text-gray-300 font-mono">
                          {log.eventType}
                        </code>
                        {log.responseStatus && (
                          <span
                            className={`text-xs font-mono ${log.responseStatus < 300 ? "text-brand-400" : "text-red-400"}`}
                          >
                            {log.responseStatus}
                          </span>
                        )}
                        <span className="text-xs text-gray-600 ml-auto">
                          {log.durationMs}ms · attempt {log.attempt}
                        </span>
                        <span className="text-xs text-gray-600">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {!log.success && log.responseBody && (
                        <p className="text-xs text-red-400/80 font-mono pl-5 truncate">
                          {log.responseBody}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  Name
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  URL
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  Events
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  Status
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {endpoints.map((ep) => (
                <tr key={ep.id} className="table-row">
                  <td className="px-5 py-3 font-medium text-gray-200">
                    {ep.name}
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-400 font-mono max-w-[200px] truncate">
                    {ep.url}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {ep.events.slice(0, 3).map((ev) => (
                        <span
                          key={ev}
                          className="text-[10px] font-mono bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded"
                        >
                          {ev}
                        </span>
                      ))}
                      {ep.events.length > 3 && (
                        <span className="text-[10px] text-gray-600">
                          +{ep.events.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge value={ep.isActive ? "active" : "inactive"} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => void openLogs(ep.id)}
                        className="btn-secondary text-xs"
                      >
                        <Clock className="w-3.5 h-3.5" /> Logs
                      </button>
                      <button
                        onClick={() => void toggleActive(ep)}
                        className="btn-secondary text-xs"
                      >
                        <Zap className="w-3.5 h-3.5" />{" "}
                        {ep.isActive ? "Disable" : "Enable"}
                      </button>
                      <button
                        onClick={() => setDeleteId(ep.id)}
                        className="btn-danger text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
