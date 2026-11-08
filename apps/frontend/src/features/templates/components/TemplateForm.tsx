import { useState } from "react";
import { MessageTemplate } from "../../../api/client";
import { extractVars } from "../hooks/useTemplates";
import { X, Check, RefreshCw } from "lucide-react";

interface Props {
  editing: MessageTemplate | null;
  onSubmit: (form: {
    name: string;
    content: string;
  }) => Promise<{ success: boolean; message: string }>;
  onClose: () => void;
}

export default function TemplateForm({ editing, onSubmit, onClose }: Props) {
  const [form, setForm] = useState({
    name: editing?.name ?? "",
    content: editing?.content ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const vars = extractVars(form.content);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await onSubmit(form);
    if (!res.success) setError(res.message);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="card w-full max-w-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">
            {editing ? "Edit Template" : "New Template"}
          </p>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="px-3 py-2 bg-red-900/30 border border-red-800/50 rounded-lg text-xs text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
          <div>
            <label className="label">Template Name *</label>
            <input
              className="input"
              placeholder="e.g. Order Confirmation"
              required
              minLength={3}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Content *</label>
            <textarea
              className="input resize-none"
              rows={5}
              required
              placeholder={"Hello {{name}}, your order {{order_id}} is ready!"}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
            <p className="text-xs text-gray-600 mt-1">
              Use {"{{variable_name}}"} for dynamic values
            </p>
          </div>

          {vars.length > 0 && (
            <div className="px-3 py-2 bg-brand-900/20 border border-brand-800/30 rounded-lg">
              <p className="text-xs text-brand-400 font-medium mb-1">
                Detected variables:
              </p>
              <div className="flex flex-wrap gap-1">
                {vars.map((v) => (
                  <code
                    key={v}
                    className="text-xs bg-brand-900/40 text-brand-300 px-2 py-0.5 rounded font-mono"
                  >{`{{${v}}}`}</code>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={saving}
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {saving ? "Saving…" : editing ? "Update" : "Create"}
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
