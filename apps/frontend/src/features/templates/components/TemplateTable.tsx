import { MessageTemplate } from "../../../api/client";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { useI18n } from "../../../context/I18nContext";

interface Props {
  templates: MessageTemplate[];
  onPreview: (tpl: MessageTemplate) => void;
  onEdit: (tpl: MessageTemplate) => void;
  onDelete: (id: string) => void;
}

export default function TemplateTable({
  templates,
  onPreview,
  onEdit,
  onDelete,
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
              Preview
            </th>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Variables
            </th>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {t("provider_configs.created", "Updated")}
            </th>
            <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {t("provider_configs.actions", "Actions")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/60">
          {templates.map((tpl) => (
            <tr key={tpl.id} className="hover:bg-gray-850/50 transition-colors">
              <td className="px-5 py-3.5 font-medium text-gray-200">{tpl.name}</td>
              <td className="px-5 py-3.5 text-gray-400 text-xs max-w-[240px] truncate">
                {tpl.content}
              </td>
              <td className="px-5 py-3.5">
                <div className="flex flex-wrap gap-1">
                  {tpl.variables.length === 0 ? (
                    <span className="text-xs text-gray-600">none</span>
                  ) : (
                    tpl.variables.map((v) => (
                      <code
                        key={v}
                        className="text-[10px] bg-gray-800 text-brand-300 px-1.5 py-0.5 rounded font-mono"
                      >{`{{${v}}}`}</code>
                    ))
                  )}
                </div>
              </td>
              <td className="px-5 py-3.5 text-gray-400 text-xs">
                {new Date(tpl.updatedAt).toLocaleDateString()}
              </td>
              <td className="px-5 py-3.5 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onPreview(tpl)}
                    className="btn-secondary text-xs px-2.5 py-1.5"
                    title={t("actions.view", "Preview")}
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onEdit(tpl)}
                    className="btn-secondary text-xs px-2.5 py-1.5"
                    title={t("actions.edit", "Edit")}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(tpl.id)}
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