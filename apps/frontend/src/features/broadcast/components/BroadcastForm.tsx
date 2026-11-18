import { useState } from "react";
import { Session, Contact } from "../../../api/client";
import { messagesApi } from "../../../api/messages";
import { useI18n } from "../../../context/I18nContext";
import { X, Play, RefreshCw, Paperclip, Image as ImageIcon, FileText, Trash2, Loader2 } from "lucide-react";

interface Props {
  sessions: Session[];
  contacts: Contact[];
  allTags: string[];
  onSubmit: (params: {
    name: string;
    sessionId: string;
    content: string;
    recipients: string[];
    delayMs: number;
  }) => Promise<{ success: boolean; message: string }>;
  onClose: () => void;
}

export default function BroadcastForm({
  sessions,
  contacts,
  allTags,
  onSubmit,
  onClose,
}: Props) {
  const { t } = useI18n();
  const [form, setForm] = useState({
    name: "",
    sessionId: "",
    content: "",
    recipients: "",
    delayMs: "2000",
  });
  const [useContacts, setUseContacts] = useState(false);
  const [selectedTag, setSelectedTag] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mediaAttachment, setMediaAttachment] = useState<{
    url: string;
    filename: string;
    type: string;
  } | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setError("Ukuran file maksimal 15MB");
      return;
    }

    setUploadingMedia(true);
    setError("");
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
          setMediaAttachment({
            url: res.data.url,
            filename: file.name,
            type: file.type.startsWith("image/") ? "image" : "document",
          });
        }
      } catch (err: any) {
        setError(err?.message || "Gagal mengunggah media");
      } finally {
        setUploadingMedia(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const getRecipients = (): string[] => {
    if (useContacts) {
      const filtered = selectedTag
        ? contacts.filter((c) => c.tags.includes(selectedTag))
        : contacts;
      return filtered.map((c) => c.phone);
    }
    return form.recipients
      .split("\n")
      .map((r) => r.trim())
      .filter(Boolean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const recipients = getRecipients();
    if (recipients.length === 0) {
      setError("No recipients");
      return;
    }
    setSaving(true);
    setError("");
    const finalContent = mediaAttachment
      ? `[MEDIA: ${mediaAttachment.url}]\n${form.content}`
      : form.content;

    const res = await onSubmit({
      name: form.name,
      sessionId: form.sessionId,
      content: finalContent,
      recipients,
      delayMs: parseInt(form.delayMs),
    });
    if (!res.success) setError(res.message);
    setSaving(false);
  };

  const recipientCount = useContacts
    ? (selectedTag
        ? contacts.filter((c) => c.tags.includes(selectedTag))
        : contacts
      ).length
    : form.recipients.split("\n").filter((r) => r.trim()).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="card w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">
            {t("broadcast.new_title", "Buat Siaran Baru")}
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
            <label className="label">{t("broadcast.name", "Nama Kampanye *")}</label>
            <input
              className="input"
              required
              placeholder={t("broadcast.name_placeholder", "Contoh: Promo Diskon")}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">{t("broadcast.session", "Sesi WhatsApp *")}</label>
            <select
              className="input"
              required
              value={form.sessionId}
              onChange={(e) => setForm({ ...form, sessionId: e.target.value })}
            >
              <option value="">{t("broadcast.select_session", "Pilih sesi aktif…")}</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label mb-0">{t("broadcast.message", "Pesan Siaran *")}</label>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-400">{t("broadcast.insert", "Sisipkan:")}</span>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, content: form.content + " {{name}}" })}
                  className="px-1.5 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-brand-300 font-mono text-[10px] border border-gray-700"
                >
                  {"{{name}}"}
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, content: form.content + " {{phone}}" })}
                  className="px-1.5 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-brand-300 font-mono text-[10px] border border-gray-700"
                >
                  {"{{phone}}"}
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, content: form.content + " {Halo|Hai|Salam}" })}
                  className="px-1.5 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-amber-300 font-mono text-[10px] border border-gray-700"
                >
                  {"{Spintax}"}
                </button>
              </div>
            </div>
            <textarea
              className="input resize-none"
              rows={4}
              required
              maxLength={4096}
              placeholder={t("broadcast.message_placeholder", "Tulis pesan siaran...")}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
            <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1.5">
              <span>💡 <strong className="text-brand-400">Anti-Ban & Variabel:</strong> Didukung Spintax <code className="bg-gray-800 px-1 py-0.5 rounded text-gray-300">{"{Halo|Hai}"}</code> &amp; variabel <code className="bg-gray-800 px-1 py-0.5 rounded text-gray-300">{"{{name}}"}</code></span>
            </p>

            {/* Media Attachment Upload for Broadcast */}
            <div className="mt-2.5 pt-2.5 border-t border-gray-800/80">
              <label className="text-xs text-gray-300 font-medium mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-brand-400" />
                  Lampiran Media Siaran (Opsional Gambar / PDF)
                </span>
                {uploadingMedia && (
                  <span className="text-[11px] text-brand-400 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Mengunggah...
                  </span>
                )}
              </label>

              {mediaAttachment ? (
                <div className="flex items-center justify-between p-2.5 bg-gray-900 border border-brand-500/30 rounded-lg">
                  <div className="flex items-center gap-2 truncate">
                    {mediaAttachment.type === "image" ? (
                      <ImageIcon className="w-4 h-4 text-brand-400 shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                    )}
                    <span className="text-xs text-white font-medium truncate">
                      {mediaAttachment.filename}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMediaAttachment(null)}
                    className="p-1 text-gray-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="border border-dashed border-gray-700 hover:border-brand-500/60 rounded-lg p-2.5 flex items-center justify-center gap-2 cursor-pointer transition-colors bg-gray-900/50 hover:bg-gray-800/50">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    disabled={uploadingMedia}
                  />
                  <Paperclip className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-400 hover:text-gray-300">
                    Klik untuk melampirkan flyer promo (JPG, PNG, PDF)
                  </span>
                </label>
              )}
            </div>
          </div>

          {/* Recipients */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <label className="label mb-0">{t("broadcast.recipients", "Penerima")}</label>
              <div className="flex gap-2 ml-auto">
                {(["Manual", "From Contacts"] as const).map((mode, i) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setUseContacts(i === 1)}
                    className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${(i === 1) === useContacts ? "bg-brand-600 text-white shadow-sm" : "bg-gray-800 text-gray-400 hover:text-gray-200"}`}
                  >
                    {mode === "Manual" ? t("broadcast.manual", "Manual") : t("broadcast.from_contacts", "Dari Kontak")}
                  </button>
                ))}
              </div>
            </div>
            {useContacts ? (
              <div className="space-y-2.5">
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedTag("")}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                      selectedTag === ""
                        ? "bg-brand-600/30 border border-brand-500 text-brand-300"
                        : "bg-gray-800/80 border border-gray-700 text-gray-400 hover:text-white"
                    }`}
                  >
                    {t("broadcast.all_contacts", "Semua")} ({contacts.length})
                  </button>
                  {allTags.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedTag(t)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                        selectedTag === t
                          ? "bg-brand-600/30 border border-brand-500 text-brand-300"
                          : "bg-gray-800/80 border border-gray-700 text-gray-400 hover:text-white"
                      }`}
                    >
                      {t} ({contacts.filter((c) => c.tags.includes(t)).length})
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-gray-900/80 border border-gray-800 rounded-lg flex items-center justify-between text-xs">
                  <span className="text-gray-400">{t("broadcast.selected_count", "Total kontak terseleksi:")}</span>
                  <span className="font-semibold text-brand-400 font-mono">
                    {recipientCount} penerima
                  </span>
                </div>
              </div>
            ) : (
              <textarea
                className="input resize-none font-mono text-xs"
                rows={5}
                placeholder={"628123456789\n628987654321\n..."}
                value={form.recipients}
                onChange={(e) =>
                  setForm({ ...form, recipients: e.target.value })
                }
              />
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label mb-0">{t("broadcast.anti_ban_delay", "Jeda Anti-Ban (ms)")}</label>
              <span className="text-[10px] text-brand-400 font-semibold flex items-center gap-1">
                🛡️ Anti-Ban Protected
              </span>
            </div>
            <div className="flex gap-2 mb-2">
              {[
                { label: "Normal (2s)", val: "2000" },
                { label: "Safe (5s)", val: "5000" },
                { label: "Ultra Safe (8s)", val: "8000" },
              ].map((preset) => (
                <button
                  key={preset.val}
                  type="button"
                  onClick={() => setForm({ ...form, delayMs: preset.val })}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                    form.delayMs === preset.val
                      ? "bg-brand-600/20 border-brand-500/40 text-brand-300"
                      : "bg-gray-800 border-gray-700 text-gray-400 hover:text-white"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <input
              type="number"
              className="input"
              min={1000}
              max={60000}
              value={form.delayMs}
              onChange={(e) => setForm({ ...form, delayMs: e.target.value })}
            />
            <p className="text-xs text-gray-500 mt-1">
              {t("broadcast.duration_estimate", "Estimasi durasi siaran:")} ~{Math.ceil(((recipientCount || 1) * parseInt(form.delayMs || "2000")) / 60000)} {t("broadcast.minutes", "menit")}.
            </p>
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
                <Play className="w-4 h-4" />
              )}
              {saving ? t("actions.saving", "Memulai…") : t("broadcast.start_btn", "Mulai Siaran")}
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>
              {t("common.cancel", "Batal")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
