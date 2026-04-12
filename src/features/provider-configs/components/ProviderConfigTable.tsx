import { ProviderConfig } from "../../../api/client";
import StatusBadge from "../../../components/StatusBadge";
import { QrCode, Power, PowerOff } from "lucide-react";

interface Props {
  configs: ProviderConfig[];
  onToggle: (cfg: ProviderConfig) => void;
  onShowQr: (configId: string) => void;
}

export default function ProviderConfigTable({
  configs,
  onToggle,
  onShowQr,
}: Props) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-800">
          {["Name", "Type", "Endpoint", "Status", "Created", ""].map((h) => (
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
        {configs.map((cfg) => (
          <tr key={cfg.id} className="table-row">
            <td className="px-5 py-3 font-medium text-gray-200">{cfg.name}</td>
            <td className="px-5 py-3">
              <StatusBadge value={cfg.providerType} />
            </td>
            <td className="px-5 py-3 text-gray-400 font-mono text-xs truncate max-w-[180px]">
              {cfg.baseUrl ?? `graph.facebook.com/${cfg.apiVersion ?? "v19.0"}`}
            </td>
            <td className="px-5 py-3">
              <StatusBadge value={cfg.isActive ? "active" : "inactive"} />
            </td>
            <td className="px-5 py-3 text-gray-500 text-xs">
              {new Date(cfg.createdAt).toLocaleDateString()}
            </td>
            <td className="px-5 py-3 text-right">
              <div className="flex items-center justify-end gap-2">
                {cfg.providerType === "baileys" && cfg.isActive && (
                  <button
                    onClick={() => onShowQr(cfg.id)}
                    className="btn-secondary text-xs"
                    title="Show QR Code"
                  >
                    <QrCode className="w-3.5 h-3.5" /> QR Code
                  </button>
                )}
                <button
                  onClick={() => onToggle(cfg)}
                  className={
                    cfg.isActive
                      ? "btn-danger text-xs"
                      : "btn-secondary text-xs"
                  }
                >
                  {cfg.isActive ? (
                    <>
                      <PowerOff className="w-3.5 h-3.5" /> Deactivate
                    </>
                  ) : (
                    <>
                      <Power className="w-3.5 h-3.5" /> Activate
                    </>
                  )}
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
