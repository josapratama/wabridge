import { BroadcastJob } from "../../../api/client";
import { STATUS_COLORS } from "../constants";
import { Ban, Play } from "lucide-react";
import { useI18n } from "../../../context/I18nContext";

interface Props {
  jobs: BroadcastJob[];
  onStart?: (id: string) => void;
  onCancel: (id: string) => void;
}

export default function BroadcastTable({ jobs, onStart, onCancel }: Props) {
  const { t } = useI18n();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 bg-gray-900/40">
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {t("contacts.name", "Name")}
            </th>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {t("broadcast.progress", "Progress")}
            </th>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {t("provider_configs.status", "Status")}
            </th>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {t("provider_configs.created", "Created")}
            </th>
            <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {t("provider_configs.actions", "Actions")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/60">
          {jobs.map((job) => {
            const pct =
              job.totalCount > 0
                ? Math.round(
                    ((job.sentCount + job.failedCount) / job.totalCount) * 100,
                  )
                : 0;
            return (
              <tr key={job.id} className="hover:bg-gray-850/50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-200">{job.name}</p>
                    {job.content?.startsWith("[MEDIA:") && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-brand-500/20 text-brand-400 border border-brand-500/30 font-medium">
                        Media
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate max-w-xs">
                    {job.content?.replace(/^\[MEDIA:\s*[^\]]+\]\s*/i, "") || `${job.totalCount} recipients`}
                  </p>
                </td>
                <td className="px-5 py-3.5 w-44">
                  <div className="space-y-1.5">
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400">
                      {job.sentCount}/{job.totalCount} ({pct}%)
                      {job.failedCount > 0 && (
                        <span className="text-red-400 ml-1">
                          · {job.failedCount} {t("broadcast.failed", "failed")}
                        </span>
                      )}
                    </p>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      STATUS_COLORS[job.status] || "bg-gray-800 text-gray-400"
                    }`}
                  >
                    {job.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-gray-400 text-xs">
                  {new Date(job.createdAt).toLocaleDateString()}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {job.status === "pending" && onStart && (
                      <button
                        onClick={() => onStart(job.id)}
                        className="btn-secondary text-xs px-2.5 py-1.5"
                        title={t("broadcast.start", "Start broadcast")}
                      >
                        <Play className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="hidden sm:inline">{t("broadcast.start", "Start")}</span>
                      </button>
                    )}
                    {["pending", "running"].includes(job.status) && (
                      <button
                        onClick={() => onCancel(job.id)}
                        className="btn-danger text-xs px-2.5 py-1.5"
                        title={t("actions.cancel", "Cancel broadcast")}
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{t("actions.cancel", "Cancel")}</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}