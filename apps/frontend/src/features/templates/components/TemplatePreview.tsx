import { useState } from "react";
import { MessageTemplate } from "../../../api/client";
import { X, Eye } from "lucide-react";

interface Props {
  template: MessageTemplate;
  onRender: (
    id: string,
    vars: Record<string, string>,
  ) => Promise<string | null>;
  onClose: () => void;
}

export default function TemplatePreview({
  template,
  onRender,
  onClose,
}: Props) {
  const [vars, setVars] = useState<Record<string, string>>(
    Object.fromEntries(template.variables.map((v) => [v, ""])),
  );
  const [result, setResult] = useState("");

  const handleRender = async () => {
    const rendered = await onRender(template.id, vars);
    if (rendered) setResult(rendered);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="card w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">
            Preview: {template.name}
          </p>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Raw content */}
        <div className="bg-gray-950 border border-gray-800 rounded-lg p-3 text-xs text-gray-400 font-mono whitespace-pre-wrap">
          {template.content}
        </div>

        {/* Variable inputs */}
        {template.variables.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 font-medium">Fill variables:</p>
            {template.variables.map((v) => (
              <div key={v}>
                <label className="label">{`{{${v}}}`}</label>
                <input
                  className="input"
                  placeholder={`Value for ${v}`}
                  value={vars[v] ?? ""}
                  onChange={(e) => setVars({ ...vars, [v]: e.target.value })}
                />
              </div>
            ))}
            <button
              onClick={() => void handleRender()}
              className="btn-secondary w-full justify-center"
            >
              <Eye className="w-4 h-4" /> Render Preview
            </button>
          </div>
        )}

        {/* Rendered result */}
        {result && (
          <div className="bg-brand-900/20 border border-brand-800/30 rounded-lg p-3 text-xs text-brand-300 whitespace-pre-wrap">
            {result}
          </div>
        )}
      </div>
    </div>
  );
}
