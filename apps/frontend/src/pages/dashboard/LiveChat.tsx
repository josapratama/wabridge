import { useState, useEffect, useRef } from "react";
import {
  messagesApi,
  Message,
  sessionsApi,
  Session,
  contactsApi,
  Contact,
  providerConfigsApi,
  healthApi,
  HealthResult,
  BASE,
} from "../../api/client";
import { useI18n } from "../../context/I18nContext";
import BaileysConnectionModal from "../../components/BaileysConnectionModal";
import {
  Search,
  Send,
  Paperclip,
  Check,
  CheckCheck,
  User,
  Clock,
  RefreshCw,
  Image as ImageIcon,
  FileText,
  Download,
  X,
  MessageSquare,
  AlertCircle,
  ExternalLink,
  QrCode,
  Users,
  Mic,
  MicOff,
  Zap,
} from "lucide-react";

interface Conversation {
  jid: string;
  phone: string;
  name: string;
  isGroup: boolean;
  sessionId?: string;
  lastMessage: Message;
  messages: Message[];
  unreadCount: number;
}

export default function LiveChat() {
  const { t } = useI18n();
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [health, setHealth] = useState<HealthResult | null>(null);
  const [selectedJid, setSelectedJid] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [attachment, setAttachment] = useState<{
    url: string;
    filename: string;
    type: "image" | "document";
    mimeType: string;
  } | null>(null);

  // Voice Note & Quick Replies
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [showQuickReplies, setShowQuickReplies] = useState(false);

  const QUICK_REPLIES = [
    {
      title: "👋 Salam Pembuka",
      text: "Halo kak! Terima kasih telah menghubungi kami. Ada yang bisa kami bantu hari ini?",
    },
    {
      title: "💳 Info Rekening Transfer",
      text: "Pembayaran dapat ditransfer ke:\n🏦 BCA: 1234567890 a/n WaBridge Indonesia\nSilakan konfirmasi bukti transfer jika sudah membayar ya kak.",
    },
    {
      title: "📦 Format Pemesanan",
      text: "Silakan melengkapi format order berikut ya kak:\n- Nama:\n- No. HP:\n- Alamat Lengkap:\n- Produk & Jumlah:",
    },
    {
      title: "⏱️ Jam Operasional CS",
      text: "Jam operasional kami adalah Senin - Sabtu pukul 08.00 - 17.00 WIB. Pertanyaan di luar jam kerja akan kami balas secepatnya.",
    },
    {
      title: "🙏 Ucapan Terima Kasih",
      text: "Terima kasih banyak kak atas pesanannya! Semoga harimu menyenangkan. Jangan ragu hubungi kami lagi jika ada pertanyaan.",
    },
  ];

  const resolveMediaUrl = (url?: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${BASE}${url}`;
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result as string;
          try {
            setUploading(true);
            const uploadRes = await messagesApi.uploadMedia({
              base64,
              filename: `voice_note_${Date.now()}.ogg`,
              mimeType: "audio/ogg",
            });
            if (uploadRes.data?.url && selectedJid && selectedSessionId) {
              setSending(true);
              const sendRes = await messagesApi.send({
                sessionId: selectedSessionId,
                to: selectedJid,
                message: "Voice Note",
                type: "audio",
                mediaUrl: uploadRes.data.url,
                mediaMimeType: "audio/ogg",
              });
              if (sendRes.success && sendRes.data) {
                setMessages((prev) => [...prev, sendRes.data!]);
              }
            }
          } catch (err: any) {
            setSendError("Gagal mengirim voice note: " + (err?.message || ""));
          } finally {
            setUploading(false);
            setSending(false);
          }
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
    } catch {
      alert("Izin akses mikrofon diperlukan untuk merekam voice note.");
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorder && recording) {
      mediaRecorder.stop();
      setRecording(false);
      setMediaRecorder(null);
    }
  };

  // Baileys QR modal state
  const [qrModal, setQrModal] = useState<{
    show: boolean;
    configId: string;
    qrCode: string | null;
    pairingCode: string | null;
  }>({ show: false, configId: "", qrCode: null, pairingCode: null });
  const [qrLoading, setQrLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    setLoading(true);
    const [msgRes, sessRes, contRes, healthRes] = await Promise.allSettled([
      messagesApi.list(),
      sessionsApi.list(),
      contactsApi.list(),
      healthApi.check(),
    ]);

    if (msgRes.status === "fulfilled" && msgRes.value.data) {
      setMessages(msgRes.value.data);
    }
    if (sessRes.status === "fulfilled" && sessRes.value.data) {
      setSessions(sessRes.value.data);
      const active = sessRes.value.data.find((s) => s.status === "active");
      if (active && !selectedSessionId) {
        setSelectedSessionId(active.id);
      } else if (sessRes.value.data.length > 0 && !selectedSessionId) {
        setSelectedSessionId(sessRes.value.data[0].id);
      }
    }
    if (contRes.status === "fulfilled" && contRes.value.data) {
      setContacts(contRes.value.data);
    }
    if (healthRes.status === "fulfilled" && healthRes.value.data) {
      setHealth(healthRes.value.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadData();
    const interval = setInterval(() => {
      void messagesApi.list().then((res) => {
        if (res.data) setMessages(res.data);
      });
      void healthApi.check().then((res) => {
        if (res.data) setHealth(res.data);
      });
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Build conversations list grouped by contact phone/jid
  const conversations: Conversation[] = (() => {
    const map = new Map<string, Message[]>();

    // Deduplicate messages by id
    const uniqueMessages = Array.from(
      new Map(messages.map((m) => [m.id, m])).values()
    );

    for (const msg of uniqueMessages) {
      const counterparty =
        msg.direction === "inbound" ? msg.from : msg.to;
      if (!counterparty) continue;

      const isGroup = counterparty.includes("@g.us");
      const cleanPhone = counterparty.replace(/@.*$/, "").replace(/:\d+$/, "");
      const groupKey = isGroup ? counterparty.split(":")[0] : cleanPhone;
      if (!groupKey) continue;

      if (!map.has(groupKey)) {
        map.set(groupKey, []);
      }
      map.get(groupKey)!.push(msg);
    }

    const convList: Conversation[] = [];
    for (const [groupKey, msgList] of map.entries()) {
      msgList.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      const lastMsg = msgList[msgList.length - 1];
      const isGroup = groupKey.includes("@g.us");
      const cleanPhone = groupKey.replace(/@.*$/, "").replace(/:\d+$/, "");

      const contact = contacts.find(
        (c) => c.phone.replace(/\D/g, "") === cleanPhone.replace(/\D/g, ""),
      );
      const name = contact
        ? contact.name
        : isGroup
          ? `WhatsApp Group (${cleanPhone.slice(-6)})`
          : `+${cleanPhone}`;

      convList.push({
        jid: groupKey,
        phone: cleanPhone,
        name,
        isGroup,
        sessionId: lastMsg.sessionId,
        lastMessage: lastMsg,
        messages: msgList,
        unreadCount: msgList.filter(
          (m) => m.direction === "inbound" && m.status === "received",
        ).length,
      });
    }

    convList.sort(
      (a, b) =>
        new Date(b.lastMessage.createdAt).getTime() -
        new Date(a.lastMessage.createdAt).getTime(),
    );
    return convList;
  })();

  const filteredConversations = conversations.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery),
  );

  const activeConv = conversations.find((c) => c.jid === selectedJid);

  const selectConversation = (c: Conversation) => {
    setSelectedJid(c.jid);
    setSendError(null);
    if (c.sessionId && sessions.some((s) => s.id === c.sessionId)) {
      setSelectedSessionId(c.sessionId);
    }
  };

  // Auto scroll to bottom when active conversation messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConv?.messages.length]);

  const currentSession = sessions.find((s) => s.id === selectedSessionId);
  const currentProviderHealth = health?.providers?.find(
    (p) => p.providerType === currentSession?.providerType,
  );
  const isSessionReady =
    currentSession?.status === "active" &&
    (currentSession?.providerType !== "baileys" || currentProviderHealth?.healthy);

  const openQrModal = (configId: string) => {
    setQrModal({ show: true, configId, qrCode: null, pairingCode: null });
    void generateQrCode(configId);
  };

  const closeQrModal = () => {
    setQrModal({ show: false, configId: "", qrCode: null, pairingCode: null });
    setQrLoading(false);
    void loadData();
  };

  const generateQrCode = async (configId?: string) => {
    const cId = configId || qrModal.configId;
    if (!cId) return;
    setQrLoading(true);
    setQrModal((prev) => ({ ...prev, qrCode: null }));

    const poll = async () => {
      const res = await providerConfigsApi.getQrCode(cId);
      if (res.data?.qrCode) {
        setQrModal((prev) => ({ ...prev, qrCode: res.data?.qrCode ?? null }));
        setQrLoading(false);
      } else {
        setTimeout(() => void poll(), 2000);
      }
    };
    await poll();
  };

  const requestPairingCode = async (phoneNumber: string) => {
    if (!phoneNumber || !qrModal.configId) return;
    setQrLoading(true);
    try {
      const res = await providerConfigsApi.requestPairingCode(
        qrModal.configId,
        phoneNumber,
      );
      if (res.data?.pairingCode) {
        setQrModal((prev) => ({
          ...prev,
          pairingCode: res.data?.pairingCode ?? null,
        }));
      }
    } finally {
      setQrLoading(false);
    }
  };

  const handleSendMessage = async (customText?: string) => {
    if (sending) return;
    const messageContent =
      customText !== undefined ? customText : inputText.trim();

    if ((!messageContent && !attachment) || !selectedJid || !selectedSessionId)
      return;

    setSending(true);
    setSendError(null);
    try {
      const type = attachment ? attachment.type : "text";
      const res = await messagesApi.send({
        sessionId: selectedSessionId,
        to: selectedJid,
        message: messageContent || attachment?.filename || "Media",
        type,
        mediaUrl: attachment?.url,
        mediaCaption: messageContent || undefined,
        mediaMimeType: attachment?.mimeType,
      });

      if (res.success && res.data) {
        setMessages((prev) => {
          const index = prev.findIndex((m) => m.id === res.data!.id);
          if (index !== -1) {
            const next = [...prev];
            next[index] = res.data!;
            return next;
          }
          return [...prev, res.data!];
        });
        setInputText("");
        setAttachment(null);
        setSendError(null);
      } else {
        const errorMsg =
          res.message ||
          (res.error as any)?.message ||
          "Failed to send message: provider is not connected";
        setSendError(errorMsg);
        // Refresh to fetch the failed message recorded in DB
        void messagesApi.list().then((mRes) => {
          if (mRes.data) setMessages(mRes.data);
        });
      }
    } catch (err: any) {
      console.error("Failed to send live chat message", err);
      setSendError(err?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const res = await messagesApi.uploadMedia({
          base64,
          filename: file.name,
          mimeType: file.type,
        });
        if (res.data?.url) {
          const isImg =
            file.type.startsWith("image/") && file.type !== "image/svg+xml";
          setAttachment({
            url: res.data.url,
            filename: file.name,
            type: isImg ? "image" : "document",
            mimeType: file.type,
          });
        }
      } catch (err) {
        console.error("Upload error", err);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-gray-950 overflow-hidden">
      {/* Baileys QR Modal */}
      <BaileysConnectionModal
        show={qrModal.show}
        configId={qrModal.configId}
        onClose={closeQrModal}
        onRequestQrCode={() => generateQrCode()}
        onRequestPairingCode={requestPairingCode}
        qrCode={qrModal.qrCode}
        pairingCode={qrModal.pairingCode}
        loading={qrLoading}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Side: Conversation List */}
        <div
          className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-gray-800 bg-gray-900/60 ${
            selectedJid ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Top Search & Session Selector */}
          <div className="p-3 border-b border-gray-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {t("nav.live_chat")} ({filteredConversations.length})
              </span>
              <button
                onClick={() => void loadData()}
                className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-gray-800 transition-colors"
                title="Refresh chats"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
                />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={t("livechat.search_placeholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-800/80 border border-gray-700/60 rounded-lg pl-9 pr-3 py-1.5 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Conversations Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-800/40">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-xs">
                {loading ? t("common.loading", "Loading chats...") : t("livechat.no_conversations")}
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isSelected = selectedJid === c.jid;
                return (
                  <div
                    key={c.jid}
                    onClick={() => selectConversation(c)}
                    className={`flex items-center gap-3 p-3.5 cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-brand-600/15 border-l-4 border-brand-500"
                        : "hover:bg-gray-800/50"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white font-semibold text-sm shrink-0 shadow">
                      {c.isGroup ? (
                        <Users className="w-4 h-4" />
                      ) : (
                        c.name.slice(0, 1).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-gray-100 truncate">
                          {c.name}
                        </p>
                        <span className="text-[10px] text-gray-500 shrink-0">
                          {new Date(c.lastMessage.createdAt).toLocaleTimeString(
                            [],
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-[11px] text-gray-400 truncate max-w-[180px]">
                          {c.lastMessage.direction === "outbound" && (
                            <span className="text-brand-400 mr-1">You:</span>
                          )}
                          {c.lastMessage.content || "[Media]"}
                        </p>
                        {c.unreadCount > 0 && (
                          <span className="w-4 h-4 rounded-full bg-brand-500 text-[10px] font-bold text-white flex items-center justify-center shrink-0">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Active Chat View */}
        <div
          className={`flex-1 flex flex-col bg-gray-950 ${
            !selectedJid ? "hidden md:flex" : "flex"
          }`}
        >
          {activeConv ? (
            <>
              {/* Chat Header */}
              <div className="h-16 border-b border-gray-800 bg-gray-900/40 px-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedJid(null)}
                    className="md:hidden text-gray-400 hover:text-white p-1"
                  >
                    ← {t("actions.back", "Back")}
                  </button>
                  <div className="w-9 h-9 rounded-full bg-brand-600/30 border border-brand-500/40 flex items-center justify-center text-brand-300 font-semibold text-sm">
                    {activeConv.isGroup ? (
                      <Users className="w-4 h-4" />
                    ) : (
                      activeConv.name.slice(0, 1).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white leading-tight">
                      {activeConv.name}
                    </h2>
                    <p className="text-[11px] text-gray-400 font-mono">
                      {activeConv.isGroup ? activeConv.jid : `+${activeConv.phone}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Provider Connection Status indicator */}
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isSessionReady
                          ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                          : "bg-amber-500 animate-pulse"
                      }`}
                    />
                    <span
                      className={`text-[11px] font-medium hidden sm:inline ${
                        isSessionReady ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {isSessionReady ? t("livechat.connected") : t("livechat.disconnected")}
                    </span>
                  </div>

                  {!isSessionReady && currentSession?.providerType === "baileys" && (
                    <button
                      onClick={() => openQrModal(currentSession.providerConfigId)}
                      className="btn-secondary text-[11px] py-1 px-2.5 flex items-center gap-1 border-amber-800/60 text-amber-300 hover:bg-amber-950/40"
                      title={t("livechat.reconnect_qr")}
                    >
                      <QrCode className="w-3.5 h-3.5" /> {t("livechat.reconnect_qr")}
                    </button>
                  )}

                  <div className="flex items-center gap-1.5">
                    <label className="text-xs text-gray-400 hidden lg:inline">
                      {t("livechat.reply_via")}
                    </label>
                    <select
                      value={selectedSessionId}
                      onChange={(e) => setSelectedSessionId(e.target.value)}
                      className="bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1 text-xs text-gray-200 focus:outline-none focus:border-brand-500"
                    >
                      {sessions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.providerType})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Warning Banner if Session is Disconnected */}
              {!isSessionReady && (
                <div className="bg-amber-950/40 border-b border-amber-900/50 px-4 py-2 flex items-center justify-between text-xs text-amber-300 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      {t("livechat.offline_banner", { name: currentSession?.name || "WhatsApp" })}
                    </span>
                  </div>
                  {currentSession?.providerType === "baileys" && (
                    <button
                      onClick={() => openQrModal(currentSession.providerConfigId)}
                      className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs flex items-center gap-1 shrink-0 ml-3 transition-colors"
                    >
                      <QrCode className="w-3.5 h-3.5" /> {t("livechat.reconnect_qr")}
                    </button>
                  )}
                </div>
              )}

              {/* Chat Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {activeConv.messages.map((m) => {
                  const isOutbound = m.direction === "outbound";
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${
                        isOutbound ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl p-3 shadow-md text-xs ${
                          isOutbound
                            ? m.status === "failed"
                              ? "bg-red-950/70 border border-red-800/80 text-red-100 rounded-br-none"
                              : "bg-brand-600 text-white rounded-br-none"
                            : "bg-gray-800 text-gray-100 rounded-bl-none border border-gray-700/60"
                        }`}
                      >
                        {/* Media Display */}
                        {m.mediaUrl && m.type === "image" && (
                          <div className="mb-2 rounded-lg overflow-hidden border border-white/10">
                            <img
                              src={resolveMediaUrl(m.mediaUrl)}
                              alt="Attached image"
                              className="max-h-60 w-full object-cover cursor-pointer hover:opacity-95"
                              onClick={() => window.open(resolveMediaUrl(m.mediaUrl), "_blank")}
                            />
                          </div>
                        )}
                        {m.mediaUrl && m.type === "audio" && (
                          <div className="my-2 p-1 bg-black/20 rounded-xl">
                            <audio
                              controls
                              className="w-56 h-8 rounded"
                              src={resolveMediaUrl(m.mediaUrl)}
                            />
                          </div>
                        )}
                        {m.mediaUrl && m.type === "document" && (
                          <a
                            href={resolveMediaUrl(m.mediaUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 mb-2 rounded bg-black/20 hover:bg-black/30 transition-colors"
                          >
                            <FileText className="w-5 h-5 text-brand-300" />
                            <span className="truncate max-w-[200px]">
                              {m.mediaCaption || t("livechat.download_document")}
                            </span>
                            <Download className="w-3.5 h-3.5 ml-auto opacity-70" />
                          </a>
                        )}

                        {/* Text Content */}
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {m.content}
                        </p>

                        {/* Timestamp & Status */}
                        <div
                          className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                            isOutbound
                              ? m.status === "failed"
                                ? "text-red-300"
                                : "text-brand-200"
                              : "text-gray-400"
                          }`}
                        >
                          <span>
                            {new Date(m.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {isOutbound && (
                            <span className="inline-flex items-center gap-1">
                              {m.status === "failed" ? (
                                <button
                                  onClick={() => {
                                    setMessages((prev) =>
                                      prev.filter((item) => item.id !== m.id),
                                    );
                                    void handleSendMessage(m.content);
                                  }}
                                  className="flex items-center gap-1 text-red-300 hover:text-white font-medium cursor-pointer transition-colors"
                                  title={t("livechat.failed_retry")}
                                >
                                  <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                                  <span className="text-[10px] underline">{t("actions.retry", "Retry")}</span>
                                </button>
                              ) : m.status === "read" || m.status === "delivered" ? (
                                <span title={m.status === "read" ? "Read" : "Delivered"}>
                                  <CheckCheck className="w-3.5 h-3.5 text-blue-300" />
                                </span>
                              ) : m.status === "sent" ? (
                                <span title="Sent to server">
                                  <Check className="w-3.5 h-3.5 text-brand-200" />
                                </span>
                              ) : (
                                <span title="Queued">
                                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Attachment Preview Bar */}
              {attachment && (
                <div className="px-4 py-2 bg-gray-900 border-t border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-brand-400">
                    {attachment.type === "image" ? (
                      <ImageIcon className="w-4 h-4" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                    <span className="font-medium truncate max-w-xs">
                      {attachment.filename}
                    </span>
                  </div>
                  <button
                    onClick={() => setAttachment(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Error Alert Bar */}
              {sendError && (
                <div className="px-4 py-2 bg-red-950/90 border-t border-red-800/80 flex items-center justify-between text-xs text-red-200 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{sendError}</span>
                  </div>
                  <button
                    onClick={() => setSendError(null)}
                    className="text-red-400 hover:text-red-200 p-0.5 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Quick Replies Menu */}
              {showQuickReplies && (
                <div className="p-3 bg-gray-900 border-t border-gray-800 animate-in slide-in-from-bottom-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" /> {t("livechat.quick_replies")}
                    </span>
                    <button
                      onClick={() => setShowQuickReplies(false)}
                      className="text-gray-500 hover:text-gray-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {QUICK_REPLIES.map((qr, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setInputText(qr.text);
                          setShowQuickReplies(false);
                        }}
                        className="text-left p-2 rounded-lg bg-gray-800/80 hover:bg-gray-800 border border-gray-700/60 hover:border-brand-500/50 transition-all group"
                      >
                        <p className="text-xs font-medium text-brand-300 group-hover:text-brand-200">
                          {qr.title}
                        </p>
                        <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
                          {qr.text}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Voice Recording Active Strip */}
              {recording && (
                <div className="px-4 py-2 bg-red-950/80 border-t border-red-800/60 flex items-center justify-between text-xs text-red-200 animate-pulse">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                    <span>{t("livechat.recording")}</span>
                  </div>
                  <button
                    onClick={stopVoiceRecording}
                    className="btn-danger py-0.5 px-2 text-[10px]"
                  >
                    {t("livechat.stop_recording")}
                  </button>
                </div>
              )}

              {/* Input Bar */}
              <div className="p-3 border-t border-gray-800 bg-gray-900/60 flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                  title={t("livechat.attach_file")}
                >
                  <Paperclip
                    className={`w-5 h-5 ${uploading ? "animate-spin" : ""}`}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => setShowQuickReplies(!showQuickReplies)}
                  className={`p-2 rounded-lg transition-colors ${
                    showQuickReplies
                      ? "bg-amber-950/60 text-amber-300 border border-amber-600/40"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                  title={t("livechat.quick_replies")}
                >
                  <Zap className="w-4 h-4 text-amber-400" />
                </button>

                <button
                  type="button"
                  onClick={recording ? stopVoiceRecording : startVoiceRecording}
                  className={`p-2 rounded-lg transition-all ${
                    recording
                      ? "bg-red-600 text-white animate-pulse"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                  title={t("livechat.voice_note")}
                >
                  {recording ? (
                    <MicOff className="w-4 h-4 text-white" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>

                <textarea
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    if (sendError) setSendError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleSendMessage();
                    }
                  }}
                  rows={1}
                  placeholder={t("livechat.input_placeholder")}
                  className="flex-1 bg-gray-800/80 border border-gray-700/60 rounded-xl px-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 resize-none max-h-28"
                />

                <button
                  onClick={() => void handleSendMessage()}
                  disabled={
                    sending || (!inputText.trim() && !attachment) || !selectedSessionId
                  }
                  className="btn-primary px-3 py-2 shrink-0"
                  title={t("livechat.send")}
                >
                  <Send
                    className={`w-4 h-4 ${sending ? "animate-spin" : ""}`}
                  />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-500">
              <div className="w-16 h-16 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-brand-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-300">
                {t("nav.live_chat")}
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm">
                {t("livechat.select_conversation")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
