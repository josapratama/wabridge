import { useState } from "react";
import { Contact } from "../../api/client";
import EmptyState from "../../components/EmptyState";
import { Users, Plus, RefreshCw, Download, Trash2 } from "lucide-react";
import {
  useContacts,
  ContactForm as FormType,
} from "../../features/contacts/hooks/useContacts";
import ContactForm from "../../features/contacts/components/ContactForm";
import ContactTable from "../../features/contacts/components/ContactTable";
import ContactTagFilter from "../../features/contacts/components/ContactTagFilter";

export default function Contacts() {
  const {
    contacts,
    loading,
    load,
    create,
    update,
    remove,
    exportContacts,
    allTags,
  } = useContacts();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterTag, setFilterTag] = useState("");

  const filtered = filterTag
    ? contacts.filter((c) => c.tags.includes(filterTag))
    : contacts;

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };
  const openEdit = (c: Contact) => {
    setEditing(c);
    setShowForm(true);
  };
  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const handleSubmit = async (form: FormType) => {
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
                onClick={() => exportContacts("csv")}
                className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-800"
              >
                CSV
              </button>
              <button
                onClick={() => exportContacts("json")}
                className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-800"
              >
                JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tag filter */}
      <ContactTagFilter
        tags={allTags}
        active={filterTag}
        onChange={setFilterTag}
      />

      {/* Form modal */}
      {showForm && (
        <ContactForm
          editing={editing}
          onSubmit={handleSubmit}
          onClose={closeForm}
        />
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
          <ContactTable
            contacts={filtered}
            onEdit={openEdit}
            onDelete={setDeleteId}
          />
        )}
      </div>
    </div>
  );
}
