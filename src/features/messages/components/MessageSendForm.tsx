import { useState } from "react";
import { Session } from "../../../api/client";
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
      setSuccess("Message sent!");
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
          <h2 className="text-base font-semibold text-white">Send Message</h2>
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
            <label className="label">Session *</label>
            <select
              className="input"
              required
              value={form.sessionId}
              onChange={(e) => setForm({ ...form, sessionId: e.target.value })}
            >
              <option value="">Select active session…</option>
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

          {/* To */}
          <div>
            <label className="label">To (phone number) *</label>
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
            <label className="label">Message Type</label>
            <div className="grid grid-cols-3 gap-1.5">
              {MESSAGE_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, type: t })}
                  className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    form.type === t
                      ? "bg-brand-600/20 border-brand-700/50 text-brand-300"
                      : "bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200"
                  }`}
                >
                  {TYPE_ICONS[t]}
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Text */}
          {form.type === "text" && (
            <div>
              <label className="label">Message *</label>
              <textarea
                className="input resize-none"
                rows={4}
                required
                maxLength={4096}
                placeholder="Type your message…"
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
                <label className="label">Media URL *</label>
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
                  <label className="label">Caption</label>
                  <input
                    className="input"
                    placeholder="Optional caption"
                    value={form.mediaCaption}
                    onChange={(e) =>
                      setForm({ ...form, mediaCaption: e.target.value })
                    }
                  />
                </div>
              )}
              <div>
                <label className="label">MIME Type</label>
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
                <label className="label">Message (for record)</label>
                <input
                  className="input"
                  placeholder="Description for message log"
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
                  <label className="label">Latitude *</label>
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
                  <label className="label">Longitude *</label>
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
                <label className="label">Location Name</label>
                <input
                  className="input"
                  placeholder="e.g. Jakarta, Indonesia"
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
              {sending ? "Sending…" : "Send"}
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
