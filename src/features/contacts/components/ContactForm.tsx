import { useState } from "react";
import { Contact } from "../../../api/client";
import { ContactForm as FormType, EMPTY_FORM } from "../hooks/useContacts";
import { X, Check, RefreshCw } from "lucide-react";

interface Props {
  editing: Contact | null;
  onSubmit: (form: FormType) => Promise<{ success: boolean; message: string }>;
  onClose: () => void;
}

export default function ContactForm({ editing, onSubmit, onClose }: Props) {
  const [form, setForm] = useState<FormType>(
    editing
      ? {
          name: editing.name,
          phone: editing.phone,
          tags: editing.tags.join(", "),
          notes: editing.notes ?? "",
        }
      : EMPTY_FORM,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
      <div className="card w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">
            {editing ? "Edit Contact" : "Add Contact"}
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
            <label className="label">Name *</label>
            <input
              className="input"
              required
              placeholder="John Doe"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Phone *</label>
            <input
              className="input"
              required
              placeholder="628123456789"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Tags</label>
            <input
              className="input"
              placeholder="customer, vip (comma separated)"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea
              className="input resize-none"
              rows={2}
              placeholder="Optional notes..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
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
              {saving ? "Saving…" : editing ? "Update" : "Add"}
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
