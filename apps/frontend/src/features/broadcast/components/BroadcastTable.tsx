import { BroadcastJob } from "../../../api/client";
import { STATUS_COLORS } from "../constants";
import { Ban, Play } from "lucide-react";

interface Props {
  jobs: BroadcastJob[];
  onStart?: (id: string) => void;
  onCancel: (id: string) => void;
}

export default function BroadcastTable({ jobs, onStart, onCancel }: Props) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-800">
          {["Name", "Progress", "Status", "Created", ""].map((h) => (
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
        {jobs.map((job) => {
          const pct =
            job.totalCount > 0
              ? Math.round(
                  ((job.sentCount + job.failedCount) / job.totalCount) * 100,
                )
              : 0;
          return (
            <tr key={job.id} className="table-row">
              <td className="px-5 py-3">
                <p className="font-medium text-gray-200">{job.name}</p>
                <p className="text-xs text-gray-500">
                  {job.totalCount} recipients
                </p>
              </td>
              <td className="px-5 py-3 w-40">
                <div className="space-y-1">
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    {job.sentCount} sent · {job.failedCount} failed
                  </p>
                </div>
              </td>
              <td className="px-5 py-3">
                <span
                  className={`text-xs font-medium ${STATUS_COLORS[job.status] ?? "text-gray-400"}`}
                >
                  ● {job.status}
                </span>
              </td>
              <td className="px-5 py-3 text-xs text-gray-500">
                {new Date(job.createdAt).toLocaleString()}
              </td>
              <td className="px-5 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  {onStart &&
                    (job.status === "pending" ||
                      job.status === "failed" ||
                      job.status === "cancelled") && (
                      <button
                        onClick={() => onStart(job.id)}
                        className="btn-primary text-xs py-1 px-2.5 flex items-center gap-1"
                      >
                        <Play className="w-3.5 h-3.5" /> Start
                      </button>
                    )}
                  {(job.status === "running" || job.status === "pending") && (
                    <button
                      onClick={() => onCancel(job.id)}
                      className="btn-danger text-xs py-1 px-2.5 flex items-center gap-1"
                    >
                      <Ban className="w-3.5 h-3.5" /> Cancel
                    </button>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
