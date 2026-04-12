import { useEffect, useState } from "react";
import { contactsApi, Contact } from "../../api/client";
import EmptyState from "../../components/EmptyState";
import {
  Users,
  Plus,
  X,
  Check,
  RefreshCw,
  Trash2,
  Pencil,
  Download,
} from "lucide-react";

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    tags: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterTag, setFilterTag] = useState("");

  const load = async () => {
    setLoading(true);
    const res = await contactsApi.list();
    if (res.data) setContacts(res.data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const allTags = [...new Set(contacts.flatMap((c) => c.tags))].sort();
  const filtered = filterTag
    ? contacts.filter((c) => c.tags.includes(filterTag))
    : contacts;

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", phone: "", tags: "", notes: "" });
    setError("");
    setShowForm(true);
  };
  const openEdit = (c: Contact) => {
    setEditing(c);
    setForm({
      name: c.name,
      phone: c.phone,
      tags: c.tags.join(", "),
      notes: c.notes ?? "",
    });
    setError("");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const tags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (editing) {
      const res = await contactsApi.update(editing.id, {
        name: form.name,
        phone: form.phone,
        tags,
        notes: form.notes || undefined,
      });
      if (res.success) {
        setShowForm(false);
        await load();
      } else setError(res.message);
    } else {
      const res = await contactsApi.create({
        name: form.name,
        phone: form.phone,
        tags,
        notes: form.notes || undefined,
      });
      if (res.success) {
        setShowForm(false);
        await load();
      } else setError(res.message);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await contactsApi.delete(id);
    setDeleteId(null);
    await load();
  };

  const handleExport = (format: "csv" | "json") => {
    const token = localStorage.getItem("token");
    const a = document.createElement("a");
    a.href = `http://localhost:3000/export/contacts?format=${format}&_token=${token}`;
    a.download = "";
    a.click();
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-400" />
            Contacts
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {contacts.length} contacts
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
            <Plus className="w-4 h-4" /> Add Contact
          </button>
          <div className="relative group">
            <button className="btn-secondary">
              <Download className="w-4 h-4" /> Export
            </button>
            <div className="absolute right-0 top-full mt-1 w-28 card py-1 hidden group-hover:block z-10">
              <button
                onClick={() => handleExport("csv")}
                className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-800"
              >
                CSV
              </button>
              <button
                onClick={() => handleExport("json")}
                className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-800"
              >
                JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterTag("")}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${!filterTag ? "bg-brand-600 text-white" : "bg-gray-800 text-gray-400 hover:text-gray-200"}`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setFilterTag(tag === filterTag ? "" : tag)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${filterTag === tag ? "bg-brand-600 text-white" : "bg-gray-800 text-gray-400 hover:text-gray-200"}`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">
                {editing ? "Edit Contact" : "Add Contact"}
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
                <label className="label">Name *</label>
                <input
                  className="input"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="label">Phone *</label>
                <input
                  className="input"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="628123456789"
                />
              </div>
              <div>
                <label className="label">Tags</label>
                <input
                  className="input"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="customer, vip (comma separated)"
                />
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea
                  className="input resize-none"
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Optional notes..."
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

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="card w-full max-w-sm p-6 space-y-4">
            <p className="text-sm font-semibold text-white">Delete Contact?</p>
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
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No contacts"
            description="Add contacts to use in broadcasts and messaging."
            action={
              <button className="btn-primary" onClick={openCreate}>
                <Plus className="w-4 h-4" /> Add Contact
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
                  Phone
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  Tags
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  Notes
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="table-row">
                  <td className="px-5 py-3 font-medium text-gray-200">
                    {c.name}
                  </td>
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
                        onClick={() => openEdit(c)}
                        className="btn-secondary text-xs"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteId(c.id)}
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
