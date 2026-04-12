import { WebhookEndpoint } from "../../../api/client";
import StatusBadge from "../../../components/StatusBadge";
import { Clock, Zap, Trash2 } from "lucide-react";

interface Props {
  endpoints: WebhookEndpoint[];
  onLogs: (id: string) => void;
  onToggle: (ep: WebhookEndpoint) => void;
  onDelete: (id: string) => void;
}

export default function WebhookTable({
  endpoints,
  onLogs,
  onToggle,
  onDelete,
}: Props) {
  return (
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
  );
}
