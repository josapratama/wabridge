import { useState } from "react";
import { WebhookEndpoint } from "../../../api/client";
import StatusBadge from "../../../components/StatusBadge";
import { Clock, Zap, Trash2, Send, CheckCircle2, AlertCircle } from "lucide-react";

interface Props {
  endpoints: WebhookEndpoint[];
  onLogs: (id: string) => void;
  onToggle: (ep: WebhookEndpoint) => void;
  onDelete: (id: string) => void;
  onTest?: (id: string) => Promise<{ success: boolean; statusCode?: number; latencyMs: number; error?: string }>;
}

export default function WebhookTable({
  endpoints,
  onLogs,
  onToggle,
  onDelete,
  onTest,
}: Props) {
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; msg: string } | null>(null);

  const handleTest = async (id: string) => {
    if (!onTest) return;
    setTestingId(id);
    setTestResult(null);
    try {
      const res = await onTest(id);
      if (res.success) {
        setTestResult({
          id,
          success: true,
          msg: `HTTP ${res.statusCode || 200} OK (${res.latencyMs}ms)`,
        });
      } else {
        setTestResult({
          id,
          success: false,
          msg: res.error || `Failed (${res.latencyMs}ms)`,
        });
      }
    } catch (err: any) {
      setTestResult({
        id,
        success: false,
        msg: err?.message || "Connection timeout",
      });
    } finally {
      setTestingId(null);
      setTimeout(() => setTestResult(null), 4000);
    }
  };

  return (
    <div className="space-y-3">
      {testResult && (
        <div
          className={`mx-5 my-2 p-2.5 rounded-xl border text-xs flex items-center gap-2 animate-in fade-in ${
            testResult.success
              ? "bg-emerald-950/60 border-emerald-800 text-emerald-300"
              : "bg-red-950/60 border-red-800 text-red-300"
          }`}
        >
          {testResult.success ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          )}
          <span>
            Webhook Test: <strong>{testResult.msg}</strong>
          </span>
        </div>
      )}

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800">
            {["Name", "URL", "Events", "Status", ""].map((h) => (
              <th
                key={h}
                className="text-left px-5 py-3 text-xs font-medium text-gray-500"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {endpoints.map((ep) => (
            <tr key={ep.id} className="table-row">
              <td className="px-5 py-3 font-medium text-gray-200">{ep.name}</td>
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
                  {onTest && (
                    <button
                      onClick={() => handleTest(ep.id)}
                      disabled={testingId === ep.id}
                      className="btn-secondary text-xs flex items-center gap-1 border-blue-500/30 text-blue-400 hover:bg-blue-950/40"
                      title="Send test ping to webhook URL"
                    >
                      <Send
                        className={`w-3.5 h-3.5 ${testingId === ep.id ? "animate-spin" : ""}`}
                      />
                      <span>{testingId === ep.id ? "Testing..." : "Test Ping"}</span>
                    </button>
                  )}
                  <button
                    onClick={() => onLogs(ep.id)}
                    className="btn-secondary text-xs"
                  >
                    <Clock className="w-3.5 h-3.5" /> Logs
                  </button>
                  <button
                    onClick={() => onToggle(ep)}
                    className="btn-secondary text-xs"
                  >
                    <Zap className="w-3.5 h-3.5" />{" "}
                    {ep.isActive ? "Disable" : "Enable"}
                  </button>
                  <button
                    onClick={() => onDelete(ep.id)}
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
    </div>
  );
}
