import { useState } from "react";
import { AutoReplyRule } from "../../api/client";
import EmptyState from "../../components/EmptyState";
import { Bot, Plus, RefreshCw, Trash2 } from "lucide-react";
import {
  useAutoReply,
  RuleForm,
} from "../../features/auto-reply/hooks/useAutoReply";
import AutoReplyForm from "../../features/auto-reply/components/AutoReplyForm";
import AutoReplyTable from "../../features/auto-reply/components/AutoReplyTable";

export default function AutoReply() {
  const {
    rules,
    sessions,
    loading,
    load,
    create,
    update,
    toggleActive,
    remove,
    sessionName,
  } = useAutoReply();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AutoReplyRule | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };
  const openEdit = (rule: AutoReplyRule) => {
    setEditing(rule);
    setShowForm(true);
  };
  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const handleSubmit = async (form: RuleForm) => {
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
            <Bot className="w-5 h-5 text-brand-400" />
            Auto-reply Rules
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Automatically reply to inbound messages
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
            <Plus className="w-4 h-4" /> New Rule
          </button>
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <AutoReplyForm
          editing={editing}
          sessions={sessions}
          onSubmit={handleSubmit}
          onClose={closeForm}
        />
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="card w-full max-w-sm p-6 space-y-4">
            <p className="text-sm font-semibold text-white">Delete Rule?</p>
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
        ) : rules.length === 0 ? (
          <EmptyState
            icon={Bot}
            title="No auto-reply rules"
            description="Create rules to automatically reply to inbound messages."
            action={
              <button className="btn-primary" onClick={openCreate}>
                <Plus className="w-4 h-4" /> New Rule
              </button>
            }
          />
        ) : (
          <AutoReplyTable
            rules={rules}
            sessionName={sessionName}
            onEdit={openEdit}
            onDelete={setDeleteId}
            onToggle={(r) => void toggleActive(r)}
          />
        )}
      </div>
    </div>
  );
}
