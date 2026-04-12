import { useState } from "react";
import { MessageTemplate } from "../../api/client";
import EmptyState from "../../components/EmptyState";
import { FileText, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useTemplates } from "../../features/templates/hooks/useTemplates";
import TemplateForm from "../../features/templates/components/TemplateForm";
import TemplatePreview from "../../features/templates/components/TemplatePreview";
import TemplateTable from "../../features/templates/components/TemplateTable";

export default function Templates() {
  const { templates, loading, load, create, update, remove, renderTemplate } =
    useTemplates();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MessageTemplate | null>(null);
  const [preview, setPreview] = useState<MessageTemplate | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };
  const openEdit = (tpl: MessageTemplate) => {
    setEditing(tpl);
    setShowForm(true);
  };
  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const handleSubmit = async (form: { name: string; content: string }) => {
    const res = editing ? await update(editing.id, form) : await create(form);
    if (res.success) closeForm();
    return res;
  };

  const handleDelete = async (id: string) => {
    await remove(id);
    setDeleteId(null);
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
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

      {/* Modals */}
      {showForm && (
        <TemplateForm
          editing={editing}
          onSubmit={handleSubmit}
          onClose={closeForm}
        />
      )}
      {preview && (
        <TemplatePreview
          template={preview}
          onRender={renderTemplate}
          onClose={() => setPreview(null)}
        />
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

      {/* Table */}
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
          <TemplateTable
            templates={templates}
            onPreview={setPreview}
            onEdit={openEdit}
            onDelete={setDeleteId}
          />
        )}
      </div>
    </div>
  );
}
