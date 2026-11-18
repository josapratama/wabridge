import { ProviderConfig } from "../../../api/client";
import StatusBadge from "../../../components/StatusBadge";
import { QrCode, Power, PowerOff, Globe, Server, Calendar, Smartphone, Radio } from "lucide-react";
import { useI18n } from "../../../context/I18nContext";

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
  const { t } = useI18n();

  return (
    <>
      {/* Desktop / Tablet Table View (md+) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900/60">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {t("provider_configs.name", "Nama Provider")}
              </th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {t("provider_configs.provider_type", "Tipe Gateway")}
              </th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {t("provider_configs.endpoint", "Endpoint / API")}
              </th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {t("provider_configs.status", "Status")}
              </th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {t("provider_configs.created", "Dibuat")}
              </th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {t("provider_configs.actions", "Aksi")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {configs.map((cfg) => {
              const isBaileys = cfg.providerType === "baileys";
              const endpoint =
                cfg.baseUrl ??
                (cfg.apiVersion ? `graph.facebook.com/${cfg.apiVersion}` : "baileys:ws-multi-device");

              return (
                <tr key={cfg.id} className="hover:bg-gray-850/50 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                          isBaileys
                            ? "bg-emerald-950/40 border-emerald-800/40 text-emerald-400 group-hover:border-emerald-500/50"
                            : "bg-blue-950/40 border-blue-800/40 text-blue-400 group-hover:border-blue-500/50"
                        }`}
                      >
                        {isBaileys ? <Smartphone className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-100 group-hover:text-white transition-colors">
                          {cfg.name}
                        </p>
                        <p className="text-[11px] text-gray-500 font-mono truncate max-w-[160px]" title={cfg.id}>
                          {cfg.id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          isBaileys
                            ? "bg-emerald-950/50 text-emerald-300 border-emerald-800/50"
                            : "bg-blue-950/50 text-blue-300 border-blue-800/50"
                        }`}
                      >
                        {isBaileys ? <Radio className="w-3 h-3 text-emerald-400" /> : <Globe className="w-3 h-3 text-blue-400" />}
                        {isBaileys ? "Baileys MD" : cfg.providerType.toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-400 font-mono text-xs truncate max-w-[220px]" title={endpoint}>
                    <span className="flex items-center gap-1.5 text-gray-300 bg-gray-950/40 border border-gray-800/60 px-2.5 py-1 rounded-lg w-fit">
                      <Server className="w-3 h-3 text-gray-500 shrink-0" />
                      <span className="truncate">{endpoint}</span>
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge value={cfg.isActive ? "active" : "inactive"} />
                  </td>
                  <td className="px-5 py-4 text-gray-400 text-xs">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                      {new Date(cfg.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {isBaileys && (
                        <button
                          onClick={() => onShowQr(cfg.id)}
                          className="btn-secondary text-xs px-2.5 py-1.5 hover:border-emerald-500/50 hover:text-emerald-300"
                          title={t("provider_configs.qr_code", "Scan QR Code / Pairing")}
                        >
                          <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{t("provider_configs.qr_code", "QR Code")}</span>
                        </button>
                      )}
                      <button
                        onClick={() => onToggle(cfg)}
                        className={`text-xs px-2.5 py-1.5 inline-flex items-center gap-1.5 rounded-lg border font-medium transition-colors ${
                          cfg.isActive
                            ? "bg-red-950/40 border-red-800/50 text-red-300 hover:bg-red-900/60"
                            : "bg-gray-800/60 border-gray-700/60 text-gray-300 hover:bg-emerald-950/40 hover:border-emerald-800/50 hover:text-emerald-300"
                        }`}
                      >
                        {cfg.isActive ? (
                          <>
                            <PowerOff className="w-3.5 h-3.5 text-red-400" />
                            <span>{t("provider_configs.deactivate", "Nonaktifkan")}</span>
                          </>
                        ) : (
                          <>
                            <Power className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{t("provider_configs.activate", "Aktifkan")}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View (< md) */}
      <div className="md:hidden divide-y divide-gray-800/70">
        {configs.map((cfg) => {
          const isBaileys = cfg.providerType === "baileys";
          const endpoint =
            cfg.baseUrl ??
            (cfg.apiVersion ? `graph.facebook.com/${cfg.apiVersion}` : "baileys:ws-multi-device");

          return (
            <div key={cfg.id} className="p-4 space-y-3 hover:bg-gray-850/40 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      isBaileys
                        ? "bg-emerald-950/40 border-emerald-800/40 text-emerald-400"
                        : "bg-blue-950/40 border-blue-800/40 text-blue-400"
                    }`}
                  >
                    {isBaileys ? <Smartphone className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-100 text-sm leading-snug">{cfg.name}</h3>
                    <p className="text-[11px] text-gray-500 font-mono">
                      {new Date(cfg.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <StatusBadge value={cfg.isActive ? "active" : "inactive"} />
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase tracking-wider border ${
                      isBaileys
                        ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/40"
                        : "bg-blue-950/40 text-blue-300 border-blue-800/40"
                    }`}
                  >
                    {cfg.providerType}
                  </span>
                </div>
              </div>

              <div className="bg-gray-950/60 rounded-xl px-3 py-2 border border-gray-800/70 text-xs font-mono text-gray-300 truncate flex items-center gap-2">
                <Server className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                <span className="truncate">{endpoint}</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                {isBaileys && (
                  <button
                    onClick={() => onShowQr(cfg.id)}
                    className="btn-secondary text-xs flex-1 justify-center py-2 hover:border-emerald-500/50 hover:text-emerald-300"
                  >
                    <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{t("provider_configs.qr_code", "QR Code")}</span>
                  </button>
                )}
                <button
                  onClick={() => onToggle(cfg)}
                  className={`text-xs py-2 px-3 flex-1 justify-center inline-flex items-center gap-1.5 rounded-lg border font-medium transition-colors ${
                    cfg.isActive
                      ? "bg-red-950/40 border-red-800/50 text-red-300 hover:bg-red-900/60"
                      : "bg-gray-800/60 border-gray-700/60 text-gray-300 hover:bg-emerald-950/40 hover:border-emerald-800/50 hover:text-emerald-300"
                  }`}
                >
                  {cfg.isActive ? (
                    <>
                      <PowerOff className="w-3.5 h-3.5 text-red-400" />
                      <span>{t("provider_configs.deactivate", "Nonaktifkan")}</span>
                    </>
                  ) : (
                    <>
                      <Power className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{t("provider_configs.activate", "Aktifkan")}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
