import { AutoReplyRule } from "../../../api/client";
import { Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

interface Props {
  rules: AutoReplyRule[];
  sessionName: (id?: string) => string;
  onEdit: (rule: AutoReplyRule) => void;
  onDelete: (id: string) => void;
  onToggle: (rule: AutoReplyRule) => void;
}

export default function AutoReplyTable({
  rules,
  sessionName,
  onEdit,
  onDelete,
  onToggle,
}: Props) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-800">
          {["Name", "Session", "Match", "Reply", "Priority", "Active", ""].map(
            (h) => (
              <th
                key={h}
                className="text-left px-5 py-3 text-xs font-medium text-gray-500"
              >
                {h}
              </th>
            ),
          )}
        </tr>
      </thead>
      <tbody>
        {rules.map((rule) => (
          <tr key={rule.id} className="table-row">
            <td className="px-5 py-3 font-medium text-gray-200">{rule.name}</td>
            <td className="px-5 py-3 text-xs text-gray-400">
              {sessionName(rule.sessionId)}
            </td>
            <td className="px-5 py-3">
              <div className="space-y-0.5">
                <span className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded font-mono">
                  {rule.matchType}
                </span>
                <p className="text-xs text-gray-300 font-mono truncate max-w-[120px]">
                  {rule.matchValue}
                </p>
              </div>
            </td>
            <td className="px-5 py-3 text-xs text-gray-400 max-w-[160px] truncate">
              {rule.replyContent}
            </td>
            <td className="px-5 py-3 text-xs text-gray-400">{rule.priority}</td>
            <td className="px-5 py-3">
              <button
                onClick={() => onToggle(rule)}
                className="text-gray-400 hover:text-gray-200 transition-colors"
              >
                {rule.isActive ? (
                  <ToggleRight className="w-5 h-5 text-brand-400" />
                ) : (
                  <ToggleLeft className="w-5 h-5" />
                )}
              </button>
            </td>
            <td className="px-5 py-3 text-right">
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => onEdit(rule)}
                  className="btn-secondary text-xs"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDelete(rule.id)}
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
