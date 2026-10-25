import { useEffect, useState } from "react";
import {
  sessionsApi,
  Session,
  WhatsAppGroup,
  messagesApi,
} from "../../api/client";
import {
  Users,
  Send,
  RefreshCw,
  Layers,
  CheckCircle2,
  AlertCircle,
  Copy,
  Clock,
  Radio,
} from "lucide-react";

export default function Groups() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [groups, setGroups] = useState<WhatsAppGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  // Send to Group Modal
  const [targetGroup, setTargetGroup] = useState<WhatsAppGroup | null>(null);
  const [groupMessage, setGroupMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState("");

  const loadSessions = async () => {
    const res = await sessionsApi.list();
    if (res.data) {
      setSessions(res.data);
      const baileys = res.data.find(
        (s) => s.providerType === "baileys" && s.status === "active",
      );
      if (baileys) {
        setSelectedSessionId(baileys.id);
      } else if (res.data.length > 0) {
        setSelectedSessionId(res.data[0].id);
      }
    }
  };

  const loadGroups = async (sessionId: string) => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const res = await sessionsApi.getGroups(sessionId);
      if (res.data) {
        setGroups(res.data);
      }
    } catch (e) {
      console.error("Failed to load groups", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSessions();
  }, []);

  useEffect(() => {
    if (selectedSessionId) {
      void loadGroups(selectedSessionId);
    }
  }, [selectedSessionId]);

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text);
    setCopySuccess(text);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  const handleSendGroupMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetGroup || !groupMessage.trim() || !selectedSessionId) return;

    setSending(true);
    setSendError("");
    setSendSuccess(false);

    try {
      const res = await messagesApi.send({
        sessionId: selectedSessionId,
        to: targetGroup.id,
        message: groupMessage.trim(),
      });
      if (res.data) {
        setSendSuccess(true);
        setTimeout(() => {
          setTargetGroup(null);
          setGroupMessage("");
          setSendSuccess(false);
        }, 1500);
      } else {
        setSendError(res.error?.code || res.message || "Failed to send message to group");
      }
    } catch (err: unknown) {
      setSendError(err instanceof Error ? err.message : "Error sending message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-400">
            View participating WhatsApp groups and broadcast announcements directly to groups
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Session:</span>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-100 focus:outline-none focus:border-brand-500"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.providerType})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => void loadGroups(selectedSessionId)}
            disabled={loading || !selectedSessionId}
            className="btn-secondary"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Fetch Groups</span>
          </button>
        </div>
      </div>

      {/* Group List / Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <RefreshCw className="w-8 h-8 animate-spin text-brand-500 mb-2" />
          <p className="text-xs">Fetching WhatsApp groups from device...</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="card p-12 text-center text-gray-500">
          <div className="w-12 h-12 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-300">No Groups Found</p>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Make sure the selected session is connected to WhatsApp and that the account is currently participating in groups.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <div
              key={group.id}
              className="card p-4 flex flex-col justify-between hover:border-brand-500/50 transition-colors group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="w-9 h-9 rounded-lg bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-gray-800 text-[10px] text-gray-300 font-mono">
                    {group.participantsCount} members
                  </span>
                </div>

                <h3 className="font-bold text-sm text-white mt-3 truncate" title={group.subject}>
                  {group.subject}
                </h3>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-gray-500">
                  <span className="font-mono truncate">{group.id}</span>
                  <button
                    onClick={() => copyToClipboard(group.id)}
                    className="hover:text-gray-300 transition-colors"
                    title="Copy Group JID"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  {copySuccess === group.id && (
                    <span className="text-[10px] text-brand-400">Copied!</span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-center justify-between">
                <span className="text-[10px] text-gray-500">
                  {group.creation
                    ? `Created ${new Date(group.creation * 1000).toLocaleDateString()}`
                    : "Group Active"}
                </span>
                <button
                  onClick={() => setTargetGroup(group)}
                  className="btn-primary text-xs py-1 px-2.5 flex items-center gap-1.5"
                >
                  <Send className="w-3 h-3" />
                  <span>Send Message</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Send Message to Group Modal */}
      {targetGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-brand-400" />
              Send to Group
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Posting message to <span className="font-semibold text-white">{targetGroup.subject}</span> ({targetGroup.participantsCount} participants)
            </p>

            <form onSubmit={handleSendGroupMessage} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Message Content
                </label>
                <textarea
                  value={groupMessage}
                  onChange={(e) => setGroupMessage(e.target.value)}
                  rows={4}
                  required
                  placeholder="Enter announcement or message to be sent to this group..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              {sendError && (
                <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-800/60 text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{sendError}</span>
                </div>
              )}

              {sendSuccess && (
                <div className="p-2.5 rounded-lg bg-brand-950/60 border border-brand-800/60 text-xs text-brand-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Message sent successfully to group!</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTargetGroup(null)}
                  className="btn-secondary"
                  disabled={sending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending || !groupMessage.trim()}
                  className="btn-primary"
                >
                  {sending ? "Sending..." : "Send to Group"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
