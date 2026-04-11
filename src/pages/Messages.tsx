import { useEffect, useState } from "react";
import { messagesApi, Message, sessionsApi, Session } from "../api/client";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";
import {
  MessageSquare,
  Send,
  X,
  RefreshCw,
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Search,
  Image,
  FileText,
  Mic,
  Video,
  MapPin,
} from "lucide-react";

const MESSAGE_TYPES = [
  "text",
  "image",
  "document",
  "audio",
  "video",
  "location",
] as const;
type MsgType = (typeof MESSAGE_TYPES)[number];

const typeIcon: Record<MsgType, React.ReactNode> = {
  text: null,
  image: <Image className="w-3 h-3" />,
  document: <FileText className="w-3 h-3" />,
  audio: <Mic className="w-3 h-3" />,
  video: <Video className="w-3 h-3" />,
  location: <MapPin className="w-3 h-3" />,
};

const emptyForm = {
  sessionId: "",
  to: "",
  message: "",
  type: "text" as MsgType,
  mediaUrl: "",
  mediaCaption: "",
  mediaMimeType: "",
  latitude: "",
  longitude: "",
  locationName: "",
};

export default function Messages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDirection, setFilterDirection] = useState("");

  const load = async () => {
    setLoading(true);
    const [m, s] = await Promise.all([messagesApi.list(), sessionsApi.list()]);
    if (m.data) setMessages([...m.data].reverse());
    if (s.data) setSessions(s.data.filter((s) => s.status === "active"));
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = messages.filter((m) => {
    if (filterStatus && m.status !== filterStatus) return false;
    if (filterDirection && m.direction !== filterDirection) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        m.content.toLowerCase().includes(q) ||
        m.from.includes(q) ||
        m.to.includes(q)
      );
    }
    return true;
  });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError("");
    setSuccess("");
    const payload: any = {
      sessionId: form.sessionId,
      to: form.to,
      message: form.message,
      type: form.type,
    };
    if (form.type !== "text" && form.type !== "location") {
      if (form.mediaUrl) payload.mediaUrl = form.mediaUrl;
      if (form.mediaCaption) payload.mediaCaption = form.mediaCaption;
      if (form.mediaMimeType) payload.mediaMimeType = form.mediaMimeType;
    }
    if (form.type === "location") {
      payload.latitude = parseFloat(form.latitude);
      payload.longitude = parseFloat(form.longitude);
      payload.locationName = form.locationName;
    }
    const res = await messagesApi.send(payload);
    if (res.success) {
      setSuccess("Message sent!");
      setForm(emptyForm);
      await load();
      setTimeout(() => setSuccess(""), 3000);
    } else {
      setError(res.message);
    }
    setSending(false);
  };

  const handleExport = (format: "csv" | "json") => {
    const params = new URLSearchParams({ format });
    if (filterStatus) params.set("status", filterStatus);
    if (filterDirection) params.set("direction", filterDirection);
    const token = localStorage.getItem("token");
    // Trigger download via anchor
    const a = document.createElement("a");
    a.href = `http://localhost:3000/export/messages?${params.toString()}`;
    // Pass token via query for file download (simple approach)
    a.href += `&_token=${token}`;
    a.download = "";
    a.click();
  };

  const isMedia = form.type !== "text" && form.type !== "location";

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Messages</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {filtered.length} messages
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
          <div className="relative group">
            <button className="btn-secondary">
              <Download className="w-4 h-4" /> Export
            </button>
            <div className="absolute right-0 top-full mt-1 w-32 card py-1 hidden group-hover:block z-10">
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
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Send className="w-4 h-4" /> Send Message
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            className="input pl-8 text-xs"
            placeholder="Search by content, from, to…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input w-36 text-xs"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {["queued", "sent", "delivered", "read", "failed", "received"].map(
            (s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ),
          )}
        </select>
        <select
          className="input w-36 text-xs"
          value={filterDirection}
          onChange={(e) => setFilterDirection(e.target.value)}
        >
          <option value="">All directions</option>
          <option value="inbound">Inbound</option>
          <option value="outbound">Outbound</option>
        </select>
      </div>

      {/* Send Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">
                Send Message
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setError("");
                }}
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

            <form onSubmit={(e) => void handleSend(e)} className="space-y-3">
              <div>
                <label className="label">Session *</label>
                <select
                  className="input"
                  required
                  value={form.sessionId}
                  onChange={(e) =>
                    setForm({ ...form, sessionId: e.target.value })
                  }
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

              {/* Message type selector */}
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
                      {typeIcon[t]}
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text message */}
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
                    onChange={(e) =>
                      setForm({ ...form, message: e.target.value })
                    }
                  />
                  <p className="text-xs text-gray-600 mt-1 text-right">
                    {form.message.length}/4096
                  </p>
                </div>
              )}

              {/* Media fields */}
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
                  {/* Text caption as message for display */}
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

              {/* Location fields */}
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
                  <input
                    type="hidden"
                    value={form.locationName || "Location"}
                    onChange={(e) =>
                      setForm({ ...form, message: e.target.value })
                    }
                  />
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
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowForm(false);
                    setError("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Messages list */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-5 h-5 text-gray-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No messages"
            description={
              search || filterStatus || filterDirection
                ? "No messages match your filters."
                : "Send your first message or wait for inbound messages."
            }
            action={
              !search && !filterStatus && !filterDirection ? (
                <button
                  className="btn-primary"
                  onClick={() => setShowForm(true)}
                >
                  <Send className="w-4 h-4" /> Send Message
                </button>
              ) : undefined
            }
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  Dir
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  From → To
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  Type
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  Content
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  Status
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  Time
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} className="table-row">
                  <td className="px-5 py-3">
                    {m.direction === "inbound" ? (
                      <ArrowDownLeft className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4 text-indigo-400" />
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs font-mono">
                    <span className="text-gray-300">{m.from}</span>
                    <span className="text-gray-600 mx-1">→</span>
                    {m.to}
                  </td>
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      {typeIcon[m.type as MsgType]}
                      {m.type}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-200 max-w-xs">
                    <p className="truncate">{m.content}</p>
                    {m.mediaUrl && (
                      <a
                        href={m.mediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-brand-400 hover:underline truncate block max-w-[200px]"
                      >
                        {m.mediaUrl}
                      </a>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge value={m.status} />
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {new Date(m.createdAt).toLocaleString()}
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
