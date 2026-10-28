import { useState, useRef } from "react";
import { Contact } from "../../api/client";
import EmptyState from "../../components/EmptyState";
import { Users, Plus, RefreshCw, Download, Trash2, Upload, FileText, X, CheckCircle2 } from "lucide-react";
import {
  useContacts,
  ContactForm as FormType,
} from "../../features/contacts/hooks/useContacts";
import ContactForm from "../../features/contacts/components/ContactForm";
import ContactTable from "../../features/contacts/components/ContactTable";
import ContactTagFilter from "../../features/contacts/components/ContactTagFilter";
import { useI18n } from "../../context/I18nContext";

export default function Contacts() {
  const { t } = useI18n();
  const {
    contacts,
    loading,
    load,
    create,
    update,
    remove,
    syncWhatsApp,
    exportContacts,
    allTags,
  } = useContacts();
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSyncWhatsApp = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await syncWhatsApp();
      if (res.success && res.data) {
        setSyncMsg(`Berhasil sinkronisasi ${res.data.synced} kontak baru dari WhatsApp!`);
      } else {
        setSyncMsg("Sinkronisasi kontak WhatsApp selesai.");
      }
    } catch {
      setSyncMsg("Gagal sinkronisasi kontak WhatsApp.");
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(null), 5000);
    }
  };
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImportText(reader.result as string);
    };
    reader.readAsText(file);
  };

  const handleRunImport = async () => {
    if (!importText.trim()) return;
    setImporting(true);
    setImportResult(null);

    const lines = importText.split("\n").map((l) => l.trim()).filter(Boolean);
    let successCount = 0;

    for (const line of lines) {
      if (line.toLowerCase().includes("phone") || line.toLowerCase().includes("nama")) continue;
      const parts = line.split(/[,;\t]/).map((p) => p.trim());
      if (parts.length >= 2) {
        const name = parts[0];
        const phone = parts[1].replace(/\D/g, "");
        const tags = parts[2]
          ? parts[2].replace(/[|;]/g, ",")
          : "imported";
        if (phone.length >= 6) {
          try {
            await create({ name, phone, tags, notes: "Imported via CSV" });
            successCount++;
          } catch (e) {
            console.error("Row import error", e);
          }
        }
      }
    }

    setImporting(false);
    setImportResult(`Successfully imported ${successCount} contacts!`);
    void load();
    setTimeout(() => {
      if (successCount > 0) {
        setShowImport(false);
        setImportText("");
        setImportResult(null);
      }
    }, 2000);
  };

  return (
    <div className="p-6 space-y-5">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-gray-400">
          {t("dashboard.total_count", { count: contacts.length })} {t("contacts.title", "contacts")}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => void load()}
            className="btn-secondary"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleSyncWhatsApp}
            disabled={syncing}
            className="btn-secondary flex items-center gap-1.5 border-emerald-500/40 text-emerald-400 hover:bg-emerald-950/40 hover:text-emerald-300 transition-colors"
            title="Import all contacts from connected WhatsApp groups & chats"
          >
            <Users className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
            <span>{syncing ? t("status.loading", "Syncing...") : "Sync WhatsApp"}</span>
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="btn-secondary flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4 text-brand-400" />
            <span>{t("actions.import", "Import CSV")}</span>
          </button>
          <button onClick={openCreate} className="btn-primary">
            <Plus className="w-4 h-4" /> {t("contacts.add_contact", "Add Contact")}
          </button>
          <div className="relative group">
            <button className="btn-secondary">
              <Download className="w-4 h-4" /> {t("actions.export", "Export")}
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

      {syncMsg && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{syncMsg}</span>
        </div>
      )}

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
            <p className="text-sm font-semibold text-white">{t("confirm.delete_title", "Delete Contact?")}</p>
            <div className="flex gap-2">
              <button
                onClick={() => void handleDelete(deleteId)}
                className="btn-danger flex-1 justify-center"
              >
                <Trash2 className="w-4 h-4" /> {t("actions.delete", "Delete")}
              </button>
              <button
                onClick={() => setDeleteId(null)}
                className="btn-secondary flex-1 justify-center"
              >
                {t("actions.cancel", "Cancel")}
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
            title={t("contacts.empty", "No contacts")}
            description={t("contacts.subtitle", "Add contacts to use in broadcasts and messaging.")}
            action={
              <button className="btn-primary" onClick={openCreate}>
                <Plus className="w-4 h-4" /> {t("contacts.add_contact", "Add Contact")}
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

      {/* Import CSV Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-gray-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-brand-400" />
                {t("actions.import", "Import Contacts via CSV / Text")}
              </h3>
              <button
                onClick={() => {
                  setShowImport(false);
                  setImportResult(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-400">
              Upload a .csv file or paste contact lines below using format:
              <br />
              <code className="text-brand-300 font-mono bg-black/40 px-1 py-0.5 rounded mt-1 inline-block">
                Name, PhoneNumber, Tags
              </code>
            </p>

            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".csv,.txt"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary text-xs flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4 text-brand-400" />
                <span>Upload .CSV File</span>
              </button>
              <span className="text-[11px] text-gray-500">
                or paste raw lines directly below:
              </span>
            </div>

            <textarea
              rows={6}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={"Budi Santoso, 628123456789, VIP;Leads\nSiti Aminah, 628987654321, Reseller\n..."}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs text-white placeholder-gray-500 font-mono focus:outline-none focus:border-brand-500 resize-none"
            />

            {importResult && (
              <div className="p-2.5 rounded-lg bg-brand-950/60 border border-brand-800/60 text-xs text-brand-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{importResult}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowImport(false);
                  setImportResult(null);
                }}
                className="btn-secondary"
                disabled={importing}
              >
                {t("actions.cancel", "Cancel")}
              </button>
              <button
                type="button"
                onClick={() => void handleRunImport()}
                disabled={importing || !importText.trim()}
                className="btn-primary"
              >
                {importing ? t("status.loading", "Importing...") : t("actions.import", "Process Import")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
