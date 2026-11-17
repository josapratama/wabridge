import { Contact } from "../../../api/client";
import { Pencil, Trash2, Phone, Tag, Calendar } from "lucide-react";
import { useI18n } from "../../../context/I18nContext";

interface Props {
  contacts: Contact[];
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void;
}

export default function ContactTable({ contacts, onEdit, onDelete }: Props) {
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
              {t("contacts.phone", "Phone")}
            </th>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {t("contacts.tags", "Tags")}
            </th>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {t("contacts.notes", "Notes")}
            </th>
            <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {t("provider_configs.actions", "Actions")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/60">
          {contacts.map((c) => (
            <tr key={c.id} className="hover:bg-gray-850/50 transition-colors">
              <td className="px-5 py-3.5 font-medium text-gray-200">{c.name}</td>
              <td className="px-5 py-3.5 text-xs text-gray-400 font-mono">
                {c.phone}
              </td>
              <td className="px-5 py-3.5">
                <div className="flex flex-wrap gap-1">
                  {c.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] bg-gray-800 text-brand-300 border border-gray-700/50 px-2 py-0.5 rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-5 py-3.5 text-xs text-gray-400 max-w-[200px] truncate">
                {c.notes ?? "—"}
              </td>
              <td className="px-5 py-3.5 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit(c)}
                    className="btn-secondary text-xs px-2.5 py-1.5"
                    title={t("actions.edit", "Edit")}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(c.id)}
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