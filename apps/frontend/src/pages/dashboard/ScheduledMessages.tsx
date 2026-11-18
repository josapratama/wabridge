import { useEffect, useState, useRef } from "react";
import {
  scheduledMessagesApi,
  sessionsApi,
  contactsApi,
  messagesApi,
  ScheduledMessage,
  Session,
  Contact,
  BASE,
} from "../../api/client";
import EmptyState from "../../components/EmptyState";
import {
  Clock,
  Plus,
  X,
  RefreshCw,
  Ban,
  Paperclip,
  Image as ImageIcon,
  FileText,
  User,
} from "lucide-react";
import { useI18n } from "../../context/I18nContext";

export default function ScheduledMessages() {
  const { t } = useI18n();
  const [messages, setMessages] = useState<ScheduledMessage[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    sessionId: "",
    to: "",
    content: "",
    scheduledAt: "",
    type: "text",
    mediaUrl: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const [m, s, c] = await Promise.all([
      scheduledMessagesApi.list(),
      sessionsApi.list(),
      contactsApi.list(),
    ]);
    if (m.data)
      setMessages(
        [...m.data].sort(
          (a, b) =>
            new Date(a.scheduledAt).getTime() -
            new Date(b.scheduledAt).getTime(),
        ),
      );
    if (s.data) setSessions(s.data.filter((s) => s.status === "active"));
    if (c.data) setContacts(c.data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMedia(true);
    setError("");

    const isImage = file.type.startsWith("image/");
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const res = await messagesApi.uploadMedia({
          base64,
          filename: file.name,
          mimeType: file.type || "application/octet-stream",
        });
        if (res.data?.url) {
          setForm((prev) => ({
            ...prev,
            mediaUrl: res.data!.url,
            type: isImage ? "image" : "document",
          }));
        }
      } catch (err: any) {
        setError("Gagal mengunggah berkas: " + (err?.message || ""));
      } finally {
        setUploadingMedia(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await scheduledMessagesApi.create(form);
    if (res.success) {
      setShowForm(false);
      setForm({
        sessionId: "",
        to: "",
        content: "",
        scheduledAt: "",
        type: "text",
        mediaUrl: "",
      });
      await load();
    } else {
      setError(res.message);
    }
    setSaving(false);
  };

  const handleCancel = async (id: string) => {
    await scheduledMessagesApi.cancel(id);
    await load();
  };

  const sessionName = (id: string) =>
    sessions.find((s) => s.id === id)?.name ?? id.slice(0, 8) + "…";

  const getContactName = (phone: string) => {
    const clean = phone.replace(/\D/g, "");
    const found = contacts.find((c) => c.phone.replace(/\D/g, "") === clean);
    return found ? found.name : null;
  };

  const statusColor: Record<string, string> = {
    pending: "text-yellow-400",
    sent: "text-brand-400",
    failed: "text-red-400",
    cancelled: "text-gray-500",
  };

  // Min datetime = now + 1 min
  const minDatetime = new Date(Date.now() + 60_000).toISOString().slice(0, 16);

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-gray-400">
          {t("scheduled.subtitle")}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => void load()}
            className="btn-secondary"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> {t("scheduled.schedule_button")}
          </button>
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">
                {t("scheduled.schedule_button")}
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
            <form onSubmit={(e) => void handleCreate(e)} className="space-y-3">
              <div>
                <label className="label">{t("scheduled.session")} *</label>
                <select
                  className="input"
                  required
                  value={form.sessionId}
                  onChange={(e) =>
                    setForm({ ...form, sessionId: e.target.value })
                  }
                >
                  <option value="">{t("common.select", "Select active session…")}</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.providerType})
                    </option>
                  ))}
                </select>
                {sessions.length === 0 && (
                  <p className="text-xs text-yellow-500 mt-1">
                    No active sessions.
                  </p>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="label mb-0">{t("scheduled.recipient")} *</label>
                  {contacts.length > 0 && (
                    <span className="text-[10px] text-gray-400">
                      Pilih dari kontak atau ketik nomor
                    </span>
                  )}
                </div>
                {contacts.length > 0 && (
                  <select
                    className="input mb-2 text-xs"
                    onChange={(e) => {
                      if (e.target.value) {
                        setForm({ ...form, to: e.target.value });
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="">-- Pilih dari Kontak CRM --</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.phone}>
                        {c.name} (+{c.phone})
                      </option>
                    ))}
                  </select>
                )}
                <input
                  className="input"
                  placeholder="628123456789"
                  required
                  value={form.to}
                  onChange={(e) => setForm({ ...form, to: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Lampiran Media (Opsional)</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleMediaUpload}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingMedia}
                    className="btn-secondary text-xs flex items-center gap-1.5"
                  >
                    <Paperclip className={`w-3.5 h-3.5 ${uploadingMedia ? "animate-spin" : ""}`} />
                    <span>{uploadingMedia ? "Mengunggah..." : "Unggah Berkas / Gambar"}</span>
                  </button>
                  {form.mediaUrl && (
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-brand-950/60 border border-brand-700/50 text-brand-300 text-xs truncate max-w-[220px]">
                      {form.type === "image" ? <ImageIcon className="w-3.5 h-3.5 shrink-0" /> : <FileText className="w-3.5 h-3.5 shrink-0" />}
                      <span className="truncate">{form.mediaUrl.split("/").pop()}</span>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, mediaUrl: "", type: "text" })}
                        className="text-red-400 hover:text-red-300 ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="label">{t("scheduled.content")} *</label>
                <textarea
                  className="input resize-none"
                  rows={4}
                  required
                  maxLength={4096}
                  placeholder={t("common.type_message", "Type your message…")}
                  value={form.content}
                  onChange={(e) =>
                    setForm({ ...form, content: e.target.value })
                  }
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="label mb-0">{t("scheduled.scheduled_for")} *</label>
                  <span className="text-[10px] text-brand-400 font-medium">
                    {t("scheduled.quick_presets", "Preset Cepat:")}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    {
                      label: t("livechat.preset_1hour", "+1 Jam"),
                      get: () => new Date(Date.now() + 3600000),
                    },
                    {
                      label: t("livechat.preset_tomorrow_morning", "Besok (09:00)"),
                      get: () => {
                        const d = new Date();
                        d.setDate(d.getDate() + 1);
                        d.setHours(9, 0, 0, 0);
                        return d;
                      },
                    },
                    {
                      label: t("livechat.preset_tomorrow_afternoon", "Besok (14:00)"),
                      get: () => {
                        const d = new Date();
                        d.setDate(d.getDate() + 1);
                        d.setHours(14, 0, 0, 0);
                        return d;
                      },
                    },
                    {
                      label: t("livechat.preset_3days", "+3 Hari"),
                      get: () => {
                        const d = new Date();
                        d.setDate(d.getDate() + 3);
                        d.setHours(10, 0, 0, 0);
                        return d;
                      },
                    },
                    {
                      label: t("livechat.preset_1week", "+1 Minggu"),
                      get: () => {
                        const d = new Date();
                        d.setDate(d.getDate() + 7);
                        d.setHours(10, 0, 0, 0);
                        return d;
                      },
                    },
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        const target = p.get();
                        const localIso = new Date(
                          target.getTime() - target.getTimezoneOffset() * 60000,
                        )
                          .toISOString()
                          .slice(0, 16);
                        setForm({ ...form, scheduledAt: localIso });
                      }}
                      className="text-[10px] font-medium px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <input
                  type="datetime-local"
                  className="input"
                  required
                  min={minDatetime}
                  value={form.scheduledAt}
                  onChange={(e) =>
                    setForm({ ...form, scheduledAt: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={saving || sessions.length === 0}
                >
                  {saving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                  {saving ? t("common.saving", "Scheduling…") : t("scheduled.schedule_button")}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowForm(false)}
                >
                  {t("actions.cancel", "Cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-5 h-5 text-gray-500 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <EmptyState
            icon={Clock}
            title={t("scheduled.empty_title")}
            description={t("scheduled.empty_desc")}
            action={
              <button className="btn-primary" onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4" /> {t("scheduled.schedule_button")}
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  {t("scheduled.scheduled_for")}
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  {t("scheduled.session")}
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  {t("scheduled.recipient")}
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  {t("scheduled.content")}
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  {t("common.status", "Status")}
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {messages.map((m) => (
                <tr key={m.id} className="table-row">
                  <td className="px-5 py-3 text-xs text-gray-300 font-mono whitespace-nowrap">
                    {new Date(m.scheduledAt).toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-400">
                    {sessionName(m.sessionId)}
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-300 font-mono">
                    <div>
                      {getContactName(m.to) && (
                        <p className="font-semibold text-white font-sans text-xs">
                          {getContactName(m.to)}
                        </p>
                      )}
                      <p className="text-gray-400 text-[11px]">{m.to}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-200 text-xs max-w-[240px]">
                    <div className="space-y-1">
                      {m.mediaUrl && (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-brand-950/60 border border-brand-700/50 text-[11px] text-brand-300">
                          {m.type === "image" ? (
                            <ImageIcon className="w-3 h-3" />
                          ) : (
                            <FileText className="w-3 h-3" />
                          )}
                          <span className="truncate max-w-[120px]">
                            {m.mediaUrl.split("/").pop()}
                          </span>
                        </div>
                      )}
                      <p className="truncate">{m.content}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs font-medium ${statusColor[m.status] ?? "text-gray-400"}`}
                    >
                      ● {t(`scheduled.status_${m.status}`, m.status)}
                    </span>
                    {m.errorMessage && (
                      <p className="text-[10px] text-red-400/70 mt-0.5 truncate max-w-[120px]">
                        {m.errorMessage}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {m.status === "pending" && (
                      <button
                        onClick={() => void handleCancel(m.id)}
                        className="btn-danger text-xs"
                      >
                        <Ban className="w-3.5 h-3.5" /> {t("scheduled.cancel")}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </div>
  );
}
