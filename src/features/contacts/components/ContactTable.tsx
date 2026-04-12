import { Contact } from "../../../api/client";
import { Pencil, Trash2 } from "lucide-react";

interface Props {
  contacts: Contact[];
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void;
}

export default function ContactTable({ contacts, onEdit, onDelete }: Props) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-800">
          {["Name", "Phone", "Tags", "Notes", ""].map((h) => (
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
        {contacts.map((c) => (
          <tr key={c.id} className="table-row">
            <td className="px-5 py-3 font-medium text-gray-200">{c.name}</td>
            <td className="px-5 py-3 text-xs text-gray-400 font-mono">
              {c.phone}
            </td>
            <td className="px-5 py-3">
              <div className="flex flex-wrap gap-1">
                {c.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </td>
            <td className="px-5 py-3 text-xs text-gray-500 max-w-[160px] truncate">
              {c.notes ?? "—"}
            </td>
            <td className="px-5 py-3 text-right">
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => onEdit(c)}
                  className="btn-secondary text-xs"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDelete(c.id)}
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
