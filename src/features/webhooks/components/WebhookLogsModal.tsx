import { WebhookLog } from "../../../api/client";
import { X, RefreshCw } from "lucide-react";

interface Props {
  logs: WebhookLog[];
  loading: boolean;
  onClose: () => void;
}

export default function WebhookLogsModal({ logs, loading, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="card w-full max-w-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <p className="text-sm font-semibold text-white">Delivery Logs</p>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          {loading ? (
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
  );
}
