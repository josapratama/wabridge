import { BroadcastJob } from "../../../api/client";
import { STATUS_COLORS } from "../constants";
import { Ban } from "lucide-react";

interface Props {
  jobs: BroadcastJob[];
  onCancel: (id: string) => void;
}

export default function BroadcastTable({ jobs, onCancel }: Props) {
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
                {(job.status === "running" || job.status === "pending") && (
                  <button
                    onClick={() => onCancel(job.id)}
                    className="btn-danger text-xs"
                  >
                    <Ban className="w-3.5 h-3.5" /> Cancel
                  </button>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
