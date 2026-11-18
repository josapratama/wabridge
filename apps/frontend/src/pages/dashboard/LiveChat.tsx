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
  aiBotApi,
  scheduledMessagesApi,
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
  CheckCircle2,
  Sparkles,
  Bot,
  Tag,
  UserPlus,
  Edit2,
  Plus,
  Trash2,
  Bell,
  BellOff,
  Calendar,
  CornerUpLeft,
  Smile,
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

function playNotificationChime() {
  try {
    const AudioCtx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.36);
  } catch {}
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

  // Quoted reply, In-chat search, and Reactions
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showInChatSearch, setShowInChatSearch] = useState(false);
  const [inChatSearchQuery, setInChatSearchQuery] = useState("");
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);

  // Sound & Desktop Notifications
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem("wabridge_livechat_sound") !== "false";
  });
  const prevInboundIdsRef = useRef<Set<string>>(new Set());

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    try {
      localStorage.setItem("wabridge_livechat_sound", String(next));
      if (next && "Notification" in window && Notification.permission === "default") {
        void Notification.requestPermission();
      }
    } catch {}
  };

  const checkNewInbounds = (msgs: Message[]) => {
    if (soundEnabled && prevInboundIdsRef.current.size > 0) {
      const newInbounds = msgs.filter(
        (m) => m.direction === "inbound" && !prevInboundIdsRef.current.has(m.id),
      );
      if (newInbounds.length > 0) {
        playNotificationChime();
        if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
          const latest = newInbounds[newInbounds.length - 1];
          try {
            new Notification(`WhatsApp: +${latest.from?.replace(/@.*$/, "")}`, {
              body: latest.content || "[Media]",
              icon: "/wa-icon.svg",
            });
          } catch {}
        }
      }
    }
    msgs.forEach((m) => {
      if (m.direction === "inbound") prevInboundIdsRef.current.add(m.id);
    });
  };

  // Voice Note & Quick Replies
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [showQuickReplies, setShowQuickReplies] = useState(false);

  // Chat Filter & Status
  const [chatFilter, setChatFilter] = useState<"all" | "unread" | "resolved">("all");
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [resolvedJids, setResolvedJids] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem("wabridge_resolved_chats");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const toggleResolved = (jid: string) => {
    setResolvedJids((prev) => {
      const updated = prev.includes(jid)
        ? prev.filter((id) => id !== jid)
        : [...prev, jid];
      try {
        localStorage.setItem("wabridge_resolved_chats", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const [aiDrafting, setAiDrafting] = useState(false);

  const handleAiDraftReply = async () => {
    if (!selectedJid || aiDrafting) return;
    setAiDrafting(true);
    setSendError(null);
    try {
      const res = await aiBotApi.draftReply(
        selectedJid,
        inputText.trim() || undefined,
      );
      if (res.data?.reply) {
        setInputText(res.data.reply);
      }
    } catch (e: any) {
      console.error("AI draft reply error", e);
      setSendError(
        t("livechat.ai_draft_err", "Gagal merumuskan draf AI. Pastikan API Key aktif di menu Auto-Reply & AI."),
      );
    } finally {
      setAiDrafting(false);
    }
  };

interface QuickReplyItem {
  id: string;
  cmd: string;
  title: string;
  text: string;
}

const DEFAULT_QUICK_REPLIES: QuickReplyItem[] = [
  {
    id: "qr-1",
    cmd: "salam",
    title: "👋 Salam Pembuka",
    text: "Halo kak! Terima kasih telah menghubungi kami. Ada yang bisa kami bantu hari ini?",
  },
  {
    id: "qr-2",
    cmd: "rekening",
    title: "💳 Info Rekening Transfer",
    text: "Pembayaran dapat ditransfer ke:\n🏦 BCA: 1234567890 a/n WaBridge Indonesia\nSilakan konfirmasi bukti transfer jika sudah membayar ya kak.",
  },
  {
    id: "qr-3",
    cmd: "order",
    title: "📦 Format Pemesanan",
    text: "Silakan melengkapi format order berikut ya kak:\n- Nama:\n- No. HP:\n- Alamat Lengkap:\n- Produk & Jumlah:",
  },
  {
    id: "qr-4",
    cmd: "jam",
    title: "⏱️ Jam Operasional CS",
    text: "Jam operasional kami adalah Senin - Sabtu pukul 08.00 - 17.00 WIB. Pertanyaan di luar jam kerja akan kami balas secepatnya.",
  },
  {
    id: "qr-5",
    cmd: "thanks",
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
      alert(t("livechat.mic_permission_err", "Izin akses mikrofon diperlukan untuk merekam voice note."));
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
      checkNewInbounds(msgRes.value.data);
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
        if (res.data) {
          setMessages(res.data);
          checkNewInbounds(res.data);
        }
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

  const [selectedTagFilter, setSelectedTagFilter] = useState<string>("all");

  // Collect all unique tags across all contacts
  const allAvailableTags = Array.from(
    new Set(contacts.flatMap((c) => c.tags || []).filter(Boolean)),
  );

  const filteredConversations = conversations.filter((c) => {
    const contact = contacts.find(
      (cnt) => cnt.phone.replace(/\D/g, "") === c.phone.replace(/\D/g, ""),
    );

    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      c.name.toLowerCase().includes(query) ||
      c.phone.includes(query) ||
      contact?.tags?.some((t) => t.toLowerCase().includes(query)) ||
      contact?.notes?.toLowerCase().includes(query) ||
      c.lastMessage.content?.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    if (selectedTagFilter !== "all") {
      const hasTag = contact?.tags?.some(
        (t) => t.toLowerCase() === selectedTagFilter.toLowerCase(),
      );
      if (!hasTag) return false;
    }

    if (chatFilter === "unread") return c.unreadCount > 0;
    if (chatFilter === "resolved") return resolvedJids.includes(c.jid);
    return true;
  });

  const activeConv = conversations.find((c) => c.jid === selectedJid);

  // Custom Quick Replies State
  const [quickReplies, setQuickReplies] = useState<QuickReplyItem[]>(() => {
    try {
      const raw = localStorage.getItem("wabridge_custom_quick_replies");
      return raw ? JSON.parse(raw) : DEFAULT_QUICK_REPLIES;
    } catch {
      return DEFAULT_QUICK_REPLIES;
    }
  });
  const [showManageQuickReplies, setShowManageQuickReplies] = useState(false);
  const [newQrCmd, setNewQrCmd] = useState("");
  const [newQrTitle, setNewQrTitle] = useState("");
  const [newQrText, setNewQrText] = useState("");

  const saveQuickReplies = (items: QuickReplyItem[]) => {
    setQuickReplies(items);
    try {
      localStorage.setItem("wabridge_custom_quick_replies", JSON.stringify(items));
    } catch {}
  };

  const handleAddQuickReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQrCmd.trim() || !newQrText.trim()) return;
    const newItem: QuickReplyItem = {
      id: `qr-${Date.now()}`,
      cmd: newQrCmd.trim().replace(/^\//, "").toLowerCase(),
      title: newQrTitle.trim() || `/${newQrCmd.trim()}`,
      text: newQrText.trim(),
    };
    saveQuickReplies([...quickReplies, newItem]);
    setNewQrCmd("");
    setNewQrTitle("");
    setNewQrText("");
  };

  const handleDeleteQuickReply = (id: string) => {
    saveQuickReplies(quickReplies.filter((qr) => qr.id !== id));
  };

  // Export Chat History as text file
  const handleExportChat = () => {
    if (!activeConv) return;
    const exportLines: string[] = [
      "==================================================",
      "WABRIDGE - RIWAYAT PERCAKAPAN WHATSAPP",
      "==================================================",
      `Kontak       : ${activeConv.name}`,
      `Nomor HP     : +${activeConv.phone}`,
      `JID          : ${activeConv.jid}`,
      `Waktu Ekspor : ${new Date().toLocaleString()}`,
      `Total Pesan  : ${activeConv.messages.length}`,
      "==================================================",
      "",
    ];

    for (const m of activeConv.messages) {
      const sender = m.direction === "outbound" ? "Anda / CS" : activeConv.name;
      const timeStr = new Date(m.createdAt).toLocaleString();
      const statusStr = m.direction === "outbound" ? ` [${m.status}]` : "";
      exportLines.push(`[${timeStr}] ${sender}${statusStr}:`);
      if (m.mediaUrl) {
        exportLines.push(`  [Media: ${m.type || "file"}] ${m.mediaCaption || m.mediaUrl}`);
      }
      if (m.content) {
        exportLines.push(`  ${m.content}`);
      }
      exportLines.push("");
    }

    exportLines.push("==================================================");
    exportLines.push("Akhir dari riwayat percakapan.");

    const blob = new Blob([exportLines.join("\n")], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat_${activeConv.phone}_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Quick Schedule Follow-up state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDatetime, setScheduleDatetime] = useState("");
  const [scheduleContent, setScheduleContent] = useState("");
  const [scheduling, setScheduling] = useState(false);
  const [scheduledToast, setScheduledToast] = useState(false);

  const openScheduleModal = () => {
    setScheduleContent(inputText.trim() || "");
    const in1Hour = new Date(Date.now() + 3600000);
    const localIso = new Date(in1Hour.getTime() - in1Hour.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setScheduleDatetime(localIso);
    setShowScheduleModal(true);
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConv || !selectedSessionId || !scheduleContent.trim() || !scheduleDatetime) return;
    setScheduling(true);
    try {
      await scheduledMessagesApi.create({
        sessionId: selectedSessionId,
        to: activeConv.phone,
        content: scheduleContent.trim(),
        scheduledAt: new Date(scheduleDatetime).toISOString(),
      });
      setShowScheduleModal(false);
      setScheduledToast(true);
      setTimeout(() => setScheduledToast(false), 2500);
    } catch (err) {
      console.error("Failed to schedule message", err);
    } finally {
      setScheduling(false);
    }
  };

  // AI Takeover status per selected conversation
  const [aiPaused, setAiPaused] = useState(false);
  const [togglingAi, setTogglingAi] = useState(false);

  useEffect(() => {
    if (!selectedJid) return;
    let isMounted = true;
    aiBotApi
      .getJidStatus(selectedJid)
      .then((res) => {
        if (isMounted && res.data) {
          setAiPaused(res.data.isPaused);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [selectedJid]);

  const handleToggleAiPause = async () => {
    if (!selectedJid || togglingAi) return;
    setTogglingAi(true);
    try {
      if (aiPaused) {
        await aiBotApi.resumeJid(selectedJid);
        setAiPaused(false);
      } else {
        await aiBotApi.pauseJid(selectedJid, 120);
        setAiPaused(true);
      }
    } catch (e) {
      console.error("Failed to toggle AI pause", e);
    } finally {
      setTogglingAi(false);
    }
  };

  // Contact Quick CRM & Tagging modal
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactNameInput, setContactNameInput] = useState("");
  const [contactTagsInput, setContactTagsInput] = useState("");
  const [contactNotesInput, setContactNotesInput] = useState("");
  const [savingContact, setSavingContact] = useState(false);
  const [contactSavedToast, setContactSavedToast] = useState(false);

  const matchedContact = activeConv
    ? contacts.find(
        (c) =>
          c.phone.replace(/\D/g, "") ===
          activeConv.phone.replace(/\D/g, ""),
      )
    : null;

  const openContactModal = () => {
    if (!activeConv) return;
    if (matchedContact) {
      setContactNameInput(matchedContact.name || "");
      setContactTagsInput((matchedContact.tags || []).join(", "));
      setContactNotesInput(matchedContact.notes || "");
    } else {
      setContactNameInput(
        activeConv.name.startsWith("+") ? "" : activeConv.name,
      );
      setContactTagsInput("");
      setContactNotesInput("");
    }
    setShowContactModal(true);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConv) return;
    setSavingContact(true);
    const tags = contactTagsInput
      .split(/[,]+/)
      .map((t) => t.trim())
      .filter(Boolean);
    try {
      if (matchedContact) {
        await contactsApi.update(matchedContact.id, {
          name: contactNameInput.trim() || activeConv.phone,
          tags,
          notes: contactNotesInput.trim(),
        });
      } else {
        await contactsApi.create({
          name: contactNameInput.trim() || activeConv.phone,
          phone: activeConv.phone,
          tags,
          notes: contactNotesInput.trim(),
        });
      }
      const refreshed = await contactsApi.list();
      if (refreshed.data) setContacts(refreshed.data);
      setShowContactModal(false);
      setContactSavedToast(true);
      setTimeout(() => setContactSavedToast(false), 2500);
    } catch (err) {
      console.error("Failed to save contact", err);
    } finally {
      setSavingContact(false);
    }
  };

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
        quotedMessageId: replyingTo?.id,
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
        setReplyingTo(null);
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

  const handleReact = async (messageId: string, emoji: string) => {
    try {
      await messagesApi.react(messageId, emoji);
    } catch (err) {
      console.error("Failed to react to message", err);
    }
  };

  const handleUnsend = async (messageId: string) => {
    if (!confirm(t("livechat.confirm_unsend", "Tarik pesan ini untuk semua orang?"))) return;
    try {
      await messagesApi.unsend(messageId);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, status: "failed", content: "[Pesan ditarik / Dihapus untuk semua]" }
            : m
        )
      );
    } catch (err) {
      console.error("Failed to unsend message", err);
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
    <div className="flex h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] flex-col bg-gray-950 overflow-hidden">
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
          {/* Top Search & Filter Tabs */}
          <div className="p-3 border-b border-gray-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-brand-400" />
                <span>{t("nav.live_chat", "Live Chat")}</span>
                <span className="text-gray-500 font-mono text-[11px]">({filteredConversations.length})</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={toggleSound}
                  className={`p-1 rounded-md transition-colors ${
                    soundEnabled
                      ? "text-brand-400 hover:text-brand-300 hover:bg-gray-800"
                      : "text-gray-500 hover:text-gray-300 hover:bg-gray-800"
                  }`}
                  title={
                    soundEnabled
                      ? t("livechat.notif_sound_on", "Notifikasi Suara Aktif")
                      : t("livechat.notif_sound_off", "Notifikasi Suara Senyap")
                  }
                >
                  {soundEnabled ? (
                    <Bell className="w-3.5 h-3.5" />
                  ) : (
                    <BellOff className="w-3.5 h-3.5" />
                  )}
                </button>
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
            </div>

            {/* Status Filter Tabs */}
            <div className="flex border border-gray-800 rounded-lg p-0.5 bg-gray-950/60 text-[11px]">
              {[
                { id: "all", label: t("livechat.tab_all", "Semua") },
                { id: "unread", label: t("livechat.tab_unread", "Belum Dibaca") },
                { id: "resolved", label: t("livechat.tab_resolved", "Selesai") },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setChatFilter(tab.id as any)}
                  className={`flex-1 py-1 text-center font-medium rounded-md transition-colors ${
                    chatFilter === tab.id
                      ? "bg-brand-600 text-white shadow-sm"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={t("livechat.search_placeholder", "Cari kontak, nomor, atau isi pesan...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-800/80 border border-gray-700/60 rounded-lg pl-9 pr-3 py-1.5 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Tag Filter Chips (Scrollable) */}
            {allAvailableTags.length > 0 && (
              <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[10px]">
                <button
                  type="button"
                  onClick={() => setSelectedTagFilter("all")}
                  className={`px-2 py-0.5 rounded-md shrink-0 font-medium transition-colors ${
                    selectedTagFilter === "all"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:text-gray-200"
                  }`}
                >
                  {t("livechat.filter_all_tags", "Semua Tag")}
                </button>
                {allAvailableTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      setSelectedTagFilter(selectedTagFilter === tag ? "all" : tag)
                    }
                    className={`px-2 py-0.5 rounded-md shrink-0 font-medium transition-colors ${
                      selectedTagFilter === tag
                        ? "bg-purple-600 text-white"
                        : "bg-purple-950/50 text-purple-300 border border-purple-800/40 hover:bg-purple-900/60"
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Conversations Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-800/40 flex flex-col">
            {filteredConversations.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-3.5 shadow-inner">
                  <MessageSquare className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-semibold text-gray-200">
                  {loading ? t("common.loading", "Memuat percakapan...") : t("livechat.no_conversations", "Belum Ada Percakapan")}
                </h3>
                <p className="text-xs text-gray-400 max-w-xs mt-1.5 leading-relaxed">
                  {t("livechat.empty_desc", "Pesan WhatsApp yang dikirim atau diterima melalui sesi aktif akan muncul di sini secara real-time.")}
                </p>
                <div className="mt-4 flex flex-col sm:flex-row gap-2 w-full max-w-xs justify-center">
                  <button
                    onClick={() => void loadData()}
                    className="btn-secondary text-xs px-3.5 py-2 inline-flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{t("actions.refresh", "Segarkan")}</span>
                  </button>
                  <a
                    href="/messages"
                    className="btn-primary text-xs px-3.5 py-2 inline-flex items-center justify-center gap-1.5 shadow-lg shadow-brand-500/20"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{t("livechat.send_new_msg", "Kirim Pesan Baru")}</span>
                  </a>
                </div>
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
              <div className="h-16 border-b border-gray-800 bg-gray-900/40 px-3 sm:px-4 flex items-center justify-between shrink-0 gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <button
                    onClick={() => setSelectedJid(null)}
                    className="md:hidden text-gray-400 hover:text-white p-1"
                  >
                    ← {t("actions.back", "Back")}
                  </button>
                  <div
                    onClick={!activeConv.isGroup ? openContactModal : undefined}
                    className={`w-9 h-9 rounded-full bg-brand-600/30 border border-brand-500/40 flex items-center justify-center text-brand-300 font-semibold text-sm shrink-0 ${
                      !activeConv.isGroup ? "cursor-pointer hover:border-brand-400" : ""
                    }`}
                    title={!activeConv.isGroup ? t("livechat.edit_contact_btn", "Edit Kontak") : undefined}
                  >
                    {activeConv.isGroup ? (
                      <Users className="w-4 h-4" />
                    ) : (
                      activeConv.name.slice(0, 1).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h2
                        onClick={!activeConv.isGroup ? openContactModal : undefined}
                        className={`text-sm font-bold text-white leading-tight truncate ${
                          !activeConv.isGroup ? "cursor-pointer hover:underline" : ""
                        }`}
                      >
                        {activeConv.name}
                      </h2>
                      {!activeConv.isGroup && (
                        <button
                          onClick={openContactModal}
                          className="text-[10px] text-gray-400 hover:text-brand-300 p-0.5 rounded transition-colors inline-flex items-center gap-1"
                          title={
                            matchedContact
                              ? t("livechat.edit_contact_btn", "Edit Kontak")
                              : t("livechat.save_contact_btn", "Simpan Kontak")
                          }
                        >
                          {matchedContact ? (
                            <Edit2 className="w-3 h-3 text-gray-400 hover:text-brand-300" />
                          ) : (
                            <UserPlus className="w-3 h-3 text-brand-400" />
                          )}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                      <p className="text-[11px] text-gray-400 font-mono">
                        {activeConv.isGroup ? activeConv.jid : `+${activeConv.phone}`}
                      </p>
                      {matchedContact?.tags && matchedContact.tags.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          {matchedContact.tags.slice(0, 2).map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/60 leading-none"
                            >
                              {tag}
                            </span>
                          ))}
                          {matchedContact.tags.length > 2 && (
                            <span className="text-[9px] text-gray-400">
                              +{matchedContact.tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-2.5">
                  {/* AI Takeover Button */}
                  {!activeConv.isGroup && (
                    <button
                      onClick={handleToggleAiPause}
                      disabled={togglingAi}
                      className={`text-xs px-2 sm:px-2.5 py-1 rounded-lg border font-medium transition-colors flex items-center gap-1.5 ${
                        aiPaused
                          ? "bg-amber-950/40 border-amber-800/60 text-amber-300 hover:bg-amber-900/50"
                          : "bg-purple-950/40 border-purple-800/60 text-purple-300 hover:bg-purple-900/50"
                      }`}
                      title={
                        aiPaused
                          ? t("livechat.resume_ai_title", "AI dijeda untuk kontak ini. Klik untuk mengaktifkan AI kembali")
                          : t("livechat.pause_ai_title", "AI sedang aktif. Klik untuk mengambil alih obrolan ini dan menjeda AI")
                      }
                    >
                      {aiPaused ? (
                        <>
                          <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="hidden sm:inline">
                            {t("livechat.ai_paused_badge", "CS Manusia (AI Dijeda)")}
                          </span>
                          <span className="sm:hidden font-semibold">CS</span>
                        </>
                      ) : (
                        <>
                          <Bot className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <span className="hidden sm:inline">
                            {t("livechat.ai_active_badge", "AI Aktif")}
                          </span>
                          <span className="sm:hidden font-semibold">AI</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* In-Chat Search Toggle */}
                  <button
                    onClick={() => {
                      setShowInChatSearch(!showInChatSearch);
                      if (showInChatSearch) setInChatSearchQuery("");
                    }}
                    className={`text-xs px-2 sm:px-2.5 py-1 rounded-lg border font-medium transition-colors flex items-center gap-1.5 ${
                      showInChatSearch
                        ? "bg-brand-950/70 border-brand-700/70 text-brand-300"
                        : "border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-750"
                    }`}
                    title="Cari kata kunci dalam riwayat obrolan ini"
                  >
                    <Search className="w-3.5 h-3.5 text-gray-400" />
                    <span className="hidden xl:inline">Cari Pesan</span>
                  </button>

                  {/* Export Chat History */}
                  <button
                    onClick={handleExportChat}
                    className="text-xs px-2 sm:px-2.5 py-1 rounded-lg border border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-750 font-medium transition-colors flex items-center gap-1.5"
                    title={t("livechat.export_chat_title", "Unduh riwayat percakapan ke file teks (.txt)")}
                  >
                    <Download className="w-3.5 h-3.5 text-gray-400" />
                    <span className="hidden xl:inline">{t("livechat.export_chat", "Export Chat")}</span>
                  </button>

                  {/* Mark as Resolved Toggle */}
                  <button
                    onClick={() => toggleResolved(activeConv.jid)}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors flex items-center gap-1.5 ${
                      resolvedJids.includes(activeConv.jid)
                        ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/50"
                        : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-750"
                    }`}
                    title={resolvedJids.includes(activeConv.jid) ? "Tandai Belum Selesai" : "Tandai Percakapan Selesai"}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">
                      {resolvedJids.includes(activeConv.jid) ? "Selesai" : "Tandai Selesai"}
                    </span>
                  </button>

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

              {/* In-Chat Search Bar */}
              {showInChatSearch && (
                <div className="bg-gray-900 border-b border-gray-800 px-4 py-2 flex items-center justify-between gap-3 animate-in fade-in">
                  <div className="flex-1 flex items-center gap-2">
                    <Search className="w-4 h-4 text-brand-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Cari kata kunci, resi, invoice dalam percakapan ini..."
                      value={inChatSearchQuery}
                      onChange={(e) => setInChatSearchQuery(e.target.value)}
                      className="bg-transparent text-xs text-white placeholder:text-gray-500 outline-none w-full"
                      autoFocus
                    />
                    {inChatSearchQuery && (
                      <span className="text-[11px] text-gray-400 shrink-0 font-medium font-mono">
                        {
                          activeConv.messages.filter(
                            (m) =>
                              m.content &&
                              m.content
                                .toLowerCase()
                                .includes(inChatSearchQuery.toLowerCase()),
                          ).length
                        }{" "}
                        pesan cocok
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setShowInChatSearch(false);
                      setInChatSearchQuery("");
                    }}
                    className="text-gray-400 hover:text-white p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Chat Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {activeConv.messages.map((m) => {
                  const isOutbound = m.direction === "outbound";
                  const isSearchMatch =
                    inChatSearchQuery &&
                    m.content &&
                    m.content
                      .toLowerCase()
                      .includes(inChatSearchQuery.toLowerCase());
                  return (
                    <div
                      key={m.id}
                      onMouseEnter={() => setHoveredMessageId(m.id)}
                      onMouseLeave={() => setHoveredMessageId(null)}
                      className={`group relative flex flex-col ${
                        isOutbound ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl p-3 shadow-md text-xs relative ${
                          isSearchMatch
                            ? "ring-2 ring-amber-400 shadow-amber-500/20"
                            : ""
                        } ${
                          isOutbound
                            ? m.status === "failed"
                              ? "bg-red-950/70 border border-red-800/80 text-red-100 rounded-br-none"
                              : "bg-brand-600 text-white rounded-br-none"
                            : "bg-gray-800 text-gray-100 rounded-bl-none border border-gray-700/60"
                        }`}
                      >
                        {/* Hover Quick Actions (Reply, React, Unsend) */}
                        <div
                          className={`absolute -top-3 ${
                            isOutbound ? "right-2" : "left-2"
                          } hidden group-hover:flex items-center gap-1 bg-gray-900 border border-gray-700 rounded-full px-2 py-0.5 shadow-lg z-20 transition-all`}
                        >
                          <button
                            type="button"
                            onClick={() => setReplyingTo(m)}
                            className="p-1 hover:text-brand-300 text-gray-400 transition-colors"
                            title="Balas / Kutip pesan ini"
                          >
                            <CornerUpLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleReact(m.id, "👍")}
                            className="hover:scale-125 transition-transform text-xs p-0.5"
                            title="Reaksi Jempol"
                          >
                            👍
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleReact(m.id, "❤️")}
                            className="hover:scale-125 transition-transform text-xs p-0.5"
                            title="Reaksi Hati"
                          >
                            ❤️
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleReact(m.id, "😂")}
                            className="hover:scale-125 transition-transform text-xs p-0.5"
                            title="Reaksi Tertawa"
                          >
                            😂
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleReact(m.id, "🙏")}
                            className="hover:scale-125 transition-transform text-xs p-0.5"
                            title="Reaksi Terima Kasih"
                          >
                            🙏
                          </button>
                          {isOutbound && m.status !== "failed" && (
                            <button
                              type="button"
                              onClick={() => void handleUnsend(m.id)}
                              className="p-1 hover:text-red-400 text-gray-400 transition-colors ml-0.5"
                              title="Tarik / Hapus untuk semua orang"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Media Display */}
                        {m.mediaUrl && m.type === "image" && (
                          <div className="mb-2 rounded-lg overflow-hidden border border-white/10">
                            <img
                              src={resolveMediaUrl(m.mediaUrl)}
                              alt="Attached image"
                              className="max-h-60 w-full object-cover cursor-pointer hover:opacity-95 rounded-lg"
                              onClick={() => setLightboxImage(resolveMediaUrl(m.mediaUrl))}
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
                              ) : m.status === "read" ? (
                                <span title={t("status.read", "Dibaca")}>
                                  <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
                                </span>
                              ) : m.status === "delivered" ? (
                                <span title={t("status.delivered", "Tersampaikan")}>
                                  <CheckCheck className="w-3.5 h-3.5 text-white/70" />
                                </span>
                              ) : m.status === "sent" ? (
                                <span title={t("status.sent", "Terkirim ke Server")}>
                                  <Check className="w-3.5 h-3.5 text-white/70" />
                                </span>
                              ) : (
                                <span title={t("status.pending", "Menunggu")}>
                                  <Clock className="w-3.5 h-3.5 text-white/50" />
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

              {/* Replying Context Bar */}
              {replyingTo && (
                <div className="px-4 py-2 bg-gray-900 border-t border-brand-500/50 flex items-center justify-between text-xs text-brand-300 animate-in fade-in">
                  <div className="flex items-center gap-2 truncate">
                    <CornerUpLeft className="w-4 h-4 text-brand-400 shrink-0" />
                    <span className="font-semibold text-white">
                      Membalas {replyingTo.direction === "outbound" ? "Anda" : activeConv?.name || "Kontak"}:
                    </span>
                    <span className="text-gray-400 truncate max-w-sm">
                      {replyingTo.content || "[Media]"}
                    </span>
                  </div>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="text-gray-400 hover:text-white p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

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
                      <Zap className="w-3.5 h-3.5 text-amber-400" /> {t("livechat.quick_replies", "Template Pesan Cepat")}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowManageQuickReplies(true)}
                        className="text-[11px] text-amber-400 hover:text-amber-300 font-medium px-2 py-0.5 rounded bg-amber-950/40 border border-amber-800/50 transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{t("livechat.manage_quick_replies", "Kelola Template")}</span>
                      </button>
                      <button
                        onClick={() => setShowQuickReplies(false)}
                        className="text-gray-500 hover:text-gray-300"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {quickReplies.map((qr) => (
                      <button
                        key={qr.id}
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
              <div className="p-3 border-t border-gray-800 bg-gray-900/60 flex items-center gap-2 relative">
                {/* Slash Command Popover */}
                {inputText.startsWith("/") && (
                  <div className="absolute bottom-full mb-2 left-4 right-4 bg-gray-900 border border-brand-500/50 rounded-xl shadow-2xl p-2.5 z-30 animate-in fade-in slide-in-from-bottom-2 backdrop-blur-md">
                    <div className="flex items-center justify-between px-2 py-1 text-[11px] text-gray-400 border-b border-gray-800 mb-2">
                      <span className="font-semibold text-brand-400 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        Quick Reply (Slash Command)
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowManageQuickReplies(true)}
                        className="text-[10px] text-amber-400 hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{t("livechat.manage_quick_replies", "Kelola Template")}</span>
                      </button>
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {quickReplies.filter(
                        (qr) =>
                          qr.cmd.toLowerCase().includes(inputText.slice(1).toLowerCase()) ||
                          qr.title.toLowerCase().includes(inputText.slice(1).toLowerCase()) ||
                          qr.text.toLowerCase().includes(inputText.slice(1).toLowerCase())
                      ).map((qr) => (
                        <button
                          key={qr.id}
                          type="button"
                          onClick={() => setInputText(qr.text)}
                          className="w-full text-left p-2 rounded-lg bg-gray-800/70 hover:bg-gray-800 border border-transparent hover:border-brand-500/40 transition-all flex items-start justify-between gap-3 group"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-mono text-brand-300 bg-brand-950/70 px-1.5 py-0.5 rounded border border-brand-700/50">
                                /{qr.cmd}
                              </span>
                              <span className="text-xs font-semibold text-white group-hover:text-brand-300 transition-colors">
                                {qr.title}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-400 line-clamp-1 mt-1 font-normal">
                              {qr.text}
                            </p>
                          </div>
                          <span className="text-[10px] font-mono text-gray-500 shrink-0 group-hover:text-brand-400 mt-1">
                            Pilih ↵
                          </span>
                        </button>
                      ))}
                      {quickReplies.filter(
                        (qr) =>
                          qr.cmd.toLowerCase().includes(inputText.slice(1).toLowerCase()) ||
                          qr.title.toLowerCase().includes(inputText.slice(1).toLowerCase()) ||
                          qr.text.toLowerCase().includes(inputText.slice(1).toLowerCase())
                      ).length === 0 && (
                        <p className="text-xs text-gray-500 p-2 text-center">
                          Tidak ada template dengan perintah "{inputText}"
                        </p>
                      )}
                    </div>
                  </div>
                )}
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
                  className="p-1.5 sm:p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                  title={t("livechat.attach_file")}
                >
                  <Paperclip
                    className={`w-4 h-4 sm:w-5 sm:h-5 ${uploading ? "animate-spin" : ""}`}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => setShowQuickReplies(!showQuickReplies)}
                  className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
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
                  onClick={openScheduleModal}
                  className="p-1.5 sm:p-2 rounded-lg text-purple-400 hover:text-white hover:bg-gray-800 transition-colors"
                  title={t("livechat.schedule_msg_btn", "Jadwalkan Pesan Follow-up")}
                >
                  <Calendar className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={recording ? stopVoiceRecording : startVoiceRecording}
                  className={`p-1.5 sm:p-2 rounded-lg transition-all ${
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

                {/* AI Copilot Draft Button */}
                <button
                  type="button"
                  onClick={() => void handleAiDraftReply()}
                  disabled={aiDrafting || !selectedJid}
                  className={`p-1.5 sm:p-2 rounded-lg transition-colors flex items-center gap-1 ${
                    aiDrafting
                      ? "bg-purple-950/80 text-purple-300 border border-purple-600/50"
                      : "text-purple-400 hover:text-purple-200 hover:bg-purple-950/40"
                  }`}
                  title={t("livechat.ai_copilot_btn", "✨ Bantu buat draf balasan dengan AI Copilot")}
                >
                  <Sparkles
                    className={`w-4 h-4 ${aiDrafting ? "animate-spin text-purple-300" : ""}`}
                  />
                </button>

                <textarea
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    if (sendError) setSendError(null);
                  }}
                  onKeyDown={(e) => {
                    if (inputText.startsWith("/")) {
                      const matches = quickReplies.filter(
                        (qr) =>
                          qr.cmd.toLowerCase().includes(inputText.slice(1).toLowerCase()) ||
                          qr.title.toLowerCase().includes(inputText.slice(1).toLowerCase()) ||
                          qr.text.toLowerCase().includes(inputText.slice(1).toLowerCase())
                      );
                      if (e.key === "Tab" && matches.length > 0) {
                        e.preventDefault();
                        setInputText(matches[0].text);
                        return;
                      }
                      if (e.key === "Escape") {
                        e.preventDefault();
                        setInputText("");
                        return;
                      }
                    }
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

      {/* Fullscreen Image Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
              <a
                href={lightboxImage}
                target="_blank"
                rel="noopener noreferrer"
                download
                onClick={(e) => e.stopPropagation()}
                className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors shadow-lg"
                title="Download original"
              >
                <Download className="w-5 h-5" />
              </a>
              <button
                onClick={() => setLightboxImage(null)}
                className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors shadow-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={lightboxImage}
              alt="Preview"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl border border-gray-800"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Contact Quick CRM & Tagging Modal */}
      {showContactModal && activeConv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-400">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {matchedContact
                      ? t("livechat.edit_contact_btn", "Edit Kontak")
                      : t("livechat.save_contact_btn", "Simpan Kontak")}
                  </h3>
                  <p className="text-[11px] text-gray-400 font-mono">
                    +{activeConv.phone}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowContactModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveContact} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  {t("livechat.contact_name_label", "Nama Kontak")}
                </label>
                <input
                  type="text"
                  value={contactNameInput}
                  onChange={(e) => setContactNameInput(e.target.value)}
                  placeholder="Contoh: Bpk. Ahmad Pratama"
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-300">
                    {t(
                      "livechat.contact_tags_label",
                      "Label / Tag Pelanggan (pisahkan dengan koma)",
                    )}
                  </label>
                </div>
                <input
                  type="text"
                  value={contactTagsInput}
                  onChange={(e) => setContactTagsInput(e.target.value)}
                  placeholder="Contoh: VIP, Lead, Prioritas"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
                {/* Quick Tag Chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {["VIP", "Lead", "Prospek", "Pelanggan", "Prioritas", "Komplain"].map(
                    (tag) => {
                      const currentTags = contactTagsInput
                        .split(/[,]+/)
                        .map((t) => t.trim())
                        .filter(Boolean);
                      const isSelected = currentTags.includes(tag);
                      return (
                        <button
                          type="button"
                          key={tag}
                          onClick={() => {
                            if (isSelected) {
                              setContactTagsInput(
                                currentTags.filter((t) => t !== tag).join(", "),
                              );
                            } else {
                              setContactTagsInput([...currentTags, tag].join(", "));
                            }
                          }}
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-md border transition-colors ${
                            isSelected
                              ? "bg-purple-600 text-white border-purple-500 shadow-sm"
                              : "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-750"
                          }`}
                        >
                          {isSelected ? `✓ ${tag}` : `+ ${tag}`}
                        </button>
                      );
                    },
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  {t("livechat.contact_notes_label", "Catatan Internal Staf")}
                </label>
                <textarea
                  rows={3}
                  value={contactNotesInput}
                  onChange={(e) => setContactNotesInput(e.target.value)}
                  placeholder={t(
                    "livechat.contact_notes_placeholder",
                    "Catatan khusus tentang pelanggan ini (hanya terlihat tim internal)...",
                  )}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowContactModal(false)}
                  className="btn-secondary text-xs px-3 py-1.5"
                >
                  {t("actions.cancel", "Batal")}
                </button>
                <button
                  type="submit"
                  disabled={savingContact}
                  className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1.5 shadow-lg shadow-brand-500/20"
                >
                  {savingContact ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>{t("common.save", "Simpan")}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contact Saved Toast Notification */}
      {contactSavedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white text-xs px-3.5 py-2 rounded-xl shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>
            {t("livechat.contact_saved_success", "Data kontak berhasil disimpan!")}
          </span>
        </div>
      )}

      {/* Manage Custom Quick Replies Modal */}
      {showManageQuickReplies && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl relative flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {t("livechat.manage_quick_replies", "Kelola Template Pesan Cepat")}
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Akses cepat menggunakan perintah <code className="text-amber-300 font-mono">/shortcut</code> di kolom chat
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowManageQuickReplies(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form to Add New Quick Reply */}
            <form onSubmit={handleAddQuickReply} className="mt-3.5 p-3 rounded-xl bg-gray-800/40 border border-gray-700/50 space-y-2.5 shrink-0">
              <span className="text-[11px] font-semibold text-gray-200 block">
                {t("livechat.add_quick_reply", "+ Tambah Template Baru")}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <input
                    type="text"
                    value={newQrCmd}
                    onChange={(e) => setNewQrCmd(e.target.value)}
                    placeholder="Shortcut (contoh: promo, ongkir)"
                    required
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={newQrTitle}
                    onChange={(e) => setNewQrTitle(e.target.value)}
                    placeholder="Judul (contoh: 🎁 Promo Diskon)"
                    required
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
              <textarea
                rows={2}
                value={newQrText}
                onChange={(e) => setNewQrText(e.target.value)}
                placeholder="Isi pesan lengkap template..."
                required
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 leading-relaxed"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="btn-primary text-xs px-3 py-1 flex items-center gap-1 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Simpan Template</span>
                </button>
              </div>
            </form>

            {/* List of Existing Quick Replies */}
            <div className="mt-3 overflow-y-auto flex-1 space-y-2 pr-1">
              <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">
                Daftar Template Tersimpan ({quickReplies.length})
              </span>
              {quickReplies.map((qr) => (
                <div
                  key={qr.id}
                  className="p-2.5 rounded-xl bg-gray-800/60 border border-gray-750 flex items-start justify-between gap-3 group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-semibold text-amber-300 bg-amber-950/70 px-1.5 py-0.5 rounded border border-amber-800/40">
                        /{qr.cmd}
                      </span>
                      <span className="text-xs font-semibold text-white truncate">
                        {qr.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 whitespace-pre-wrap mt-1 leading-relaxed">
                      {qr.text}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteQuickReply(qr.id)}
                    className="text-gray-500 hover:text-red-400 p-1 rounded hover:bg-gray-700/50 transition-colors shrink-0"
                    title="Hapus template"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Schedule Message Modal */}
      {showScheduleModal && activeConv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {t("livechat.schedule_modal_title", "Jadwalkan Pesan Follow-up")}
                  </h3>
                  <p className="text-[11px] text-gray-400 font-mono">
                    +{activeConv.phone} ({activeConv.name})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSchedule} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Isi Pesan Terjadwal
                </label>
                <textarea
                  rows={3}
                  required
                  value={scheduleContent}
                  onChange={(e) => setScheduleContent(e.target.value)}
                  placeholder="Ketik pesan yang akan dikirim secara otomatis..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 leading-relaxed"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-300">
                    Waktu Pengiriman
                  </label>
                  <span className="text-[10px] text-purple-400 font-medium">Preset Cepat:</span>
                </div>
                {/* Presets */}
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
                        setScheduleDatetime(localIso);
                      }}
                      className="text-[10px] font-medium px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <input
                  type="datetime-local"
                  required
                  value={scheduleDatetime}
                  onChange={(e) => setScheduleDatetime(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="btn-secondary text-xs px-3 py-1.5"
                >
                  {t("actions.cancel", "Batal")}
                </button>
                <button
                  type="submit"
                  disabled={scheduling || !scheduleContent.trim()}
                  className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1.5 shadow-lg shadow-brand-500/20"
                >
                  {scheduling ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Clock className="w-3.5 h-3.5" />
                  )}
                  <span>Jadwalkan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scheduled Toast */}
      {scheduledToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-purple-600 text-white text-xs px-3.5 py-2 rounded-xl shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{t("livechat.schedule_success", "Pesan berhasil dijadwalkan!")}</span>
        </div>
      )}
    </div>
  );
}
