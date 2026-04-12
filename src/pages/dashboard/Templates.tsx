import { useEffect, useState } from "react";
import { messageTemplatesApi, MessageTemplate } from "../../api/client";
import EmptyState from "../../components/EmptyState";
import {
  FileText,
  Plus,
  X,
  Check,
  RefreshCw,
  Trash2,
  Pencil,
  Eye,
} from "lucide-react";

export default function Templates() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MessageTemplate | null>(null);
  const [form, setForm] = useState({ name: "", content: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<MessageTemplate | null>(null);
  const [previewVars, setPreviewVars] = useState<Record<string, string>>({});
  const [previewResult, setPreviewResult] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await messageTemplatesApi.list();
    if (res.data) setTemplates(res.data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const extractVars = (content: string) => [
    ...new Set(
      (content.match(/\{\{(\w+)\}\}/g) ?? []).map((m) => m.slice(2, -2)),
    ),
  ];

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", content: "" });
    setError("");
    setShowForm(true);
  };

  const openEdit = (tpl: MessageTemplate) => {
    setEditing(tpl);
    setForm({ name: tpl.name, content: tpl.content });
    setError("");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    if (editing) {
      const res = await messageTemplatesApi.update(editing.id, form);
      if (res.success) {
        setShowForm(false);
        await load();
      } else setError(res.message);
    } else {
      const res = await messageTemplatesApi.create(form);
      if (res.success) {
        setShowForm(false);
        await load();
      } else setError(res.message);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await messageTemplatesApi.delete(id);
    setDeleteId(null);
    await load();
  };

  const openPreview = (tpl: MessageTemplate) => {
    setPreview(tpl);
    setPreviewVars(Object.fromEntries(tpl.variables.map((v) => [v, ""])));
    setPreviewResult("");
  };

  const renderPreview = async () => {
    if (!preview) return;
    const res = await messageTemplatesApi.render(preview.id, previewVars);
    if (res.data) setPreviewResult(res.data as unknown as string);
  };

  const vars = extractVars(form.content);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-400" />
            Message Templates
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Reusable messages with {"{{variable}}"} placeholders
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void load()}
            className="btn-secondary"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={openCreate} className="btn-primary">
            <Plus className="w-4 h-4" /> New Template
          </button>
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="card w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">
                {editing ? "Edit Template" : "New Template"}
              </p>
              <button
                onClick={() => setShowForm(false)}
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
                  placeholder={
                    "Hello {{name}}, your order {{order_id}} is ready!"
                  }
                  required
                  value={form.content}
                  onChange={(e) =>
                    setForm({ ...form, content: e.target.value })
                  }
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
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">
                Preview: {preview.name}
              </p>
              <button
                onClick={() => setPreview(null)}
                className="text-gray-500 hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-gray-950 border border-gray-800 rounded-lg p-3 text-xs text-gray-400 font-mono whitespace-pre-wrap">
              {preview.content}
            </div>
            {preview.variables.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 font-medium">
                  Fill variables:
                </p>
                {preview.variables.map((v) => (
                  <div key={v}>
                    <label className="label">{`{{${v}}}`}</label>
                    <input
                      className="input"
                      placeholder={`Value for ${v}`}
                      value={previewVars[v] ?? ""}
                      onChange={(e) =>
                        setPreviewVars({ ...previewVars, [v]: e.target.value })
                      }
                    />
                  </div>
                ))}
                <button
                  onClick={() => void renderPreview()}
                  className="btn-secondary w-full justify-center"
                >
                  <Eye className="w-4 h-4" /> Render Preview
                </button>
              </div>
            )}
            {previewResult && (
              <div className="bg-brand-900/20 border border-brand-800/30 rounded-lg p-3 text-xs text-brand-300 whitespace-pre-wrap">
                {previewResult}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="card w-full max-w-sm p-6 space-y-4">
            <p className="text-sm font-semibold text-white">Delete Template?</p>
            <div className="flex gap-2">
              <button
                onClick={() => void handleDelete(deleteId)}
                className="btn-danger flex-1 justify-center"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
              <button
                onClick={() => setDeleteId(null)}
                className="btn-secondary flex-1 justify-center"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-5 h-5 text-gray-500 animate-spin" />
          </div>
        ) : templates.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No templates"
            description={
              "Create reusable message templates with {{variable}} placeholders."
            }
            action={
              <button className="btn-primary" onClick={openCreate}>
                <Plus className="w-4 h-4" /> New Template
              </button>
            }
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  Name
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  Preview
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  Variables
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  Updated
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {templates.map((tpl) => (
                <tr key={tpl.id} className="table-row">
                  <td className="px-5 py-3 font-medium text-gray-200">
                    {tpl.name}
                  </td>
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
                        onClick={() => openPreview(tpl)}
                        className="btn-secondary text-xs"
                      >
                        <Eye className="w-3.5 h-3.5" /> Preview
                      </button>
                      <button
                        onClick={() => openEdit(tpl)}
                        className="btn-secondary text-xs"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteId(tpl.id)}
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
        )}
      </div>
    </div>
  );
}
