import { useState } from "react";
import { Session } from "../../../api/client";
import { useI18n } from "../../../context/I18nContext";
import {
  MESSAGE_TYPES,
  TYPE_ICONS,
  EMPTY_SEND_FORM,
  SendForm,
} from "../constants";
import { X, Send, RefreshCw } from "lucide-react";

interface Props {
  sessions: Session[];
  onSend: (form: SendForm) => Promise<{ success: boolean; message: string }>;
  onClose: () => void;
}

export default function MessageSendForm({ sessions, onSend, onClose }: Props) {
  const { t } = useI18n();
  const [form, setForm] = useState<SendForm>(EMPTY_SEND_FORM);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isMedia = form.type !== "text" && form.type !== "location";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError("");
    setSuccess("");
    const res = await onSend(form);
    if (res.success) {
      setSuccess(t("messages.sent_success", "Pesan berhasil dikirim!"));
      setForm(EMPTY_SEND_FORM);
      setTimeout(() => setSuccess(""), 3000);
    } else {
      setError(res.message);
    }
    setSending(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="card w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">
            {t("messages.send_title", "Kirim Pesan WhatsApp")}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="px-3 py-2 bg-red-900/30 border border-red-800/50 rounded-lg text-sm text-red-300">
            {error}
          </div>
        )}
        {success && (
          <div className="px-3 py-2 bg-brand-900/30 border border-brand-800/50 rounded-lg text-sm text-brand-300">
            {success}
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
          {/* Session */}
          <div>
            <label className="label">{t("messages.session", "Sesi WhatsApp *")}</label>
            <select
              className="input"
              required
              value={form.sessionId}
              onChange={(e) => setForm({ ...form, sessionId: e.target.value })}
            >
              <option value="">{t("messages.select_session", "Pilih sesi aktif…")}</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.providerType})
                </option>
              ))}
            </select>
            {sessions.length === 0 && (
              <p className="text-xs text-yellow-500 mt-1">
                {t("messages.no_active_sessions", "Tidak ada sesi WhatsApp aktif.")}
              </p>
            )}
          </div>

          {/* To */}
          <div>
            <label className="label">{t("messages.recipient_phone", "Nomor Tujuan (WhatsApp) *")}</label>
            <input
              className="input"
              placeholder="628123456789"
              required
              value={form.to}
              onChange={(e) => setForm({ ...form, to: e.target.value })}
            />
          </div>

          {/* Type selector */}
          <div>
            <label className="label">{t("messages.message_type", "Tipe Pesan")}</label>
            <div className="grid grid-cols-3 gap-1.5">
              {MESSAGE_TYPES.map((tType) => (
                <button
                  key={tType}
                  type="button"
                  onClick={() => setForm({ ...form, type: tType })}
                  className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    form.type === tType
                      ? "bg-brand-600/20 border-brand-700/50 text-brand-300"
                      : "bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200"
                  }`}
                >
                  {TYPE_ICONS[tType]}
                  {tType}
                </button>
              ))}
            </div>
          </div>

          {/* Text */}
          {form.type === "text" && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label mb-0">{t("messages.content", "Isi Pesan *")}</label>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-gray-500">{t("messages.quick_template", "Template:")}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        message:
                          "Halo kak! Terima kasih sudah menghubungi kami. Ada yang bisa kami bantu?",
                      })
                    }
                    className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-brand-300 border border-gray-700"
                  >
                    Salam
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        message:
                          "Halo kak, kami ingin mengonfirmasi pesanan Anda sudah kami proses dan siap dikirim. Terima kasih!",
                      })
                    }
                    className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-brand-300 border border-gray-700"
                  >
                    Konfirmasi
                  </button>
                </div>
              </div>
              <textarea
                className="input resize-none"
                rows={4}
                required
                maxLength={4096}
                placeholder={t("messages.type_placeholder", "Ketik pesan Anda…")}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
              <p className="text-xs text-gray-600 mt-1 text-right">
                {form.message.length}/4096
              </p>
            </div>
          )}

          {/* Media */}
          {isMedia && (
            <>
              <div>
                <label className="label">{t("messages.media_url", "URL Media *")}</label>
                <input
                  className="input"
                  type="url"
                  required
                  placeholder="https://example.com/file.jpg"
                  value={form.mediaUrl}
                  onChange={(e) =>
                    setForm({ ...form, mediaUrl: e.target.value })
                  }
                />
              </div>
              {(form.type === "image" ||
                form.type === "document" ||
                form.type === "video") && (
                <div>
                  <label className="label">{t("messages.caption", "Keterangan (Caption)")}</label>
                  <input
                    className="input"
                    placeholder={t("messages.caption_placeholder", "Keterangan opsional")}
                    value={form.mediaCaption}
                    onChange={(e) =>
                      setForm({ ...form, mediaCaption: e.target.value })
                    }
                  />
                </div>
              )}
              <div>
                <label className="label">{t("messages.mime_type", "Tipe MIME")}</label>
                <input
                  className="input"
                  placeholder={
                    form.type === "image"
                      ? "image/jpeg"
                      : form.type === "document"
                        ? "application/pdf"
                        : form.type === "audio"
                          ? "audio/mpeg"
                          : "video/mp4"
                  }
                  value={form.mediaMimeType}
                  onChange={(e) =>
                    setForm({ ...form, mediaMimeType: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">{t("messages.description_record", "Deskripsi Log Pesan")}</label>
                <input
                  className="input"
                  placeholder={t("messages.description_placeholder", "Deskripsi untuk arsip log")}
                  value={form.message}
                  onChange={(e) =>
                    setForm({ ...form, message: e.target.value })
                  }
                />
              </div>
            </>
          )}

          {/* Location */}
          {form.type === "location" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">{t("messages.latitude", "Garis Lintang (Latitude) *")}</label>
                  <input
                    className="input"
                    type="number"
                    step="any"
                    required
                    placeholder="-6.2088"
                    value={form.latitude}
                    onChange={(e) =>
                      setForm({ ...form, latitude: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="label">{t("messages.longitude", "Garis Bujur (Longitude) *")}</label>
                  <input
                    className="input"
                    type="number"
                    step="any"
                    required
                    placeholder="106.8456"
                    value={form.longitude}
                    onChange={(e) =>
                      setForm({ ...form, longitude: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="label">{t("messages.location_name", "Nama Lokasi")}</label>
                <input
                  className="input"
                  placeholder={t("messages.location_placeholder", "Contoh: Jakarta, Indonesia")}
                  value={form.locationName}
                  onChange={(e) =>
                    setForm({ ...form, locationName: e.target.value })
                  }
                />
              </div>
            </>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={sending || sessions.length === 0}
            >
              {sending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {sending ? t("actions.saving", "Mengirim…") : t("messages.send_btn", "Kirim Pesan")}
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
