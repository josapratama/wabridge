import { MessageTemplate } from "../../../api/client";
import { Eye, Pencil, Trash2 } from "lucide-react";

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
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-800">
          {["Name", "Preview", "Variables", "Updated", ""].map((h) => (
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
        {templates.map((tpl) => (
          <tr key={tpl.id} className="table-row">
            <td className="px-5 py-3 font-medium text-gray-200">{tpl.name}</td>
            <td className="px-5 py-3 text-gray-400 text-xs max-w-[240px] truncate">
              {tpl.content}
            </td>
            <td className="px-5 py-3">
              <div className="flex flex-wrap gap-1">
                {tpl.variables.length === 0 ? (
                  <span className="text-xs text-gray-600">none</span>
                ) : (
                  tpl.variables.map((v) => (
                    <code
                      key={v}
                      className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded font-mono"
                    >{`{{${v}}}`}</code>
                  ))
                )}
              </div>
            </td>
            <td className="px-5 py-3 text-gray-500 text-xs">
              {new Date(tpl.updatedAt).toLocaleDateString()}
            </td>
            <td className="px-5 py-3 text-right">
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => onPreview(tpl)}
                  className="btn-secondary text-xs"
                >
                  <Eye className="w-3.5 h-3.5" /> Preview
                </button>
                <button
                  onClick={() => onEdit(tpl)}
                  className="btn-secondary text-xs"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDelete(tpl.id)}
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
