import { Message } from "../../../api/client";
import StatusBadge from "../../../components/StatusBadge";
import { TYPE_ICONS, MsgType } from "../constants";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

interface Props {
  messages: Message[];
}

export default function MessageTable({ messages }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-gray-800">
            {["Dir", "From → To", "Type", "Content", "Status", "Time"].map(
              (h) => (
                <th
                  key={h}
                  className="text-left px-5 py-3 text-xs font-medium text-gray-500 whitespace-nowrap"
                >
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {messages.map((m) => (
            <tr key={m.id} className="table-row">
              <td className="px-5 py-3 whitespace-nowrap">
                {m.direction === "inbound" ? (
                  <ArrowDownLeft className="w-4 h-4 text-cyan-400" />
                ) : (
                  <ArrowUpRight className="w-4 h-4 text-indigo-400" />
                )}
              </td>
              <td className="px-5 py-3 text-gray-400 text-xs font-mono whitespace-nowrap">
                <span className="text-gray-300">{m.from}</span>
                <span className="text-gray-600 mx-1">→</span>
                {m.to}
              </td>
              <td className="px-5 py-3 whitespace-nowrap">
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  {TYPE_ICONS[m.type as MsgType]}
                  {m.type}
                </span>
              </td>
              <td className="px-5 py-3 text-gray-200 max-w-xs md:max-w-md">
                <p className="truncate" title={m.content}>{m.content}</p>
                {m.mediaUrl && (
                  <a
                    href={m.mediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-brand-400 hover:underline truncate block max-w-[200px]"
                  >
                    {m.mediaUrl}
                  </a>
                )}
              </td>
              <td className="px-5 py-3 whitespace-nowrap">
                <StatusBadge value={m.status} />
              </td>
              <td className="px-5 py-3 text-gray-500 text-xs whitespace-nowrap">
                {new Date(m.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
