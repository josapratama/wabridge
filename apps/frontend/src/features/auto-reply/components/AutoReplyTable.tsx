import { AutoReplyRule } from "../../../api/client";
import { Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { useI18n } from "../../../context/I18nContext";

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
              {t("sessions.session_name", "Session")}
            </th>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Match
            </th>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Reply
            </th>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Priority
            </th>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {t("provider_configs.status", "Active")}
            </th>
            <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {t("provider_configs.actions", "Actions")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/60">
          {rules.map((rule) => (
            <tr key={rule.id} className="hover:bg-gray-850/50 transition-colors">
              <td className="px-5 py-3.5 font-medium text-gray-200">{rule.name}</td>
              <td className="px-5 py-3.5 text-xs text-gray-400">
                {sessionName(rule.sessionId)}
              </td>
              <td className="px-5 py-3.5">
                <div className="space-y-0.5">
                  <span className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded font-mono">
                    {rule.matchType}
                  </span>
                  <p className="text-xs text-gray-300 font-mono truncate max-w-[120px]">
                    {rule.matchValue}
                  </p>
                </div>
              </td>
              <td className="px-5 py-3.5 text-xs text-gray-400 max-w-[180px] truncate">
                {rule.replyContent}
              </td>
              <td className="px-5 py-3.5 text-xs text-gray-400">{rule.priority}</td>
              <td className="px-5 py-3.5">
                <button
                  onClick={() => onToggle(rule)}
                  className="text-gray-400 hover:text-gray-200 transition-colors"
                  title={rule.isActive ? t("provider_configs.deactivate", "Deactivate") : t("provider_configs.activate", "Activate")}
                >
                  {rule.isActive ? (
                    <ToggleRight className="w-6 h-6 text-brand-400" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-gray-600" />
                  )}
                </button>
              </td>
              <td className="px-5 py-3.5 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit(rule)}
                    className="btn-secondary text-xs px-2.5 py-1.5"
                    title={t("actions.edit", "Edit")}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(rule.id)}
                    className="btn-danger text-xs px-2.5 py-1.5"
                    title={t("actions.delete", "Delete")}
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