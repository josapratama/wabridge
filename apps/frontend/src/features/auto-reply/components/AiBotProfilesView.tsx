import { useState, useEffect, useRef, useMemo } from "react";
import {
  aiBotApi,
  AiBotProfile,
  AiConnection,
  Session,
} from "../../../api/client";
import {
  Sparkles,
  Plus,
  RefreshCw,
  Copy,
  Trash2,
  Edit3,
  Check,
  Send,
  Upload,
  CheckCircle2,
  AlertCircle,
  Info,
  Eye,
  EyeOff,
  Bot,
  Layers,
  Clock,
  RotateCcw,
  Smartphone,
  ChevronRight,
  X,
  FileText,
  Search,
  Key,
  Users,
  UserCheck,
  UserX,
  Play,
  Globe,
  Sliders,
  Calendar,
  Moon,
  Sun,
  Zap,
  Briefcase,
  Settings,
  Shield,
} from "lucide-react";
import { useI18n } from "../../../context/I18nContext";

export const PROVIDER_MODELS: Record<string, Array<{ id: string; name: string; desc: string }>> = {
  gemini: [
    { id: "gemini-3.6-flash", name: "Gemini 3.6 Flash (Aktif - Cepat & Cerdas)", desc: "Generasi 3 tercanggih untuk chat cerdas & penalaran tinggi dari Google" },
    { id: "gemini-3.5-flash-lite", name: "Gemini 3.5 Flash-Lite (Aktif - Super Cepat)", desc: "Ultra ringan, latensi paling rendah & efisien biaya" },
    { id: "gemini-3.8-flash", name: "Gemini 3.8 Flash (Aktif - Performa Tinggi)", desc: "Model Flash level atas untuk tugas kompleks & agentic" },
    { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro (Aktif - Penalaran Mendalam)", desc: "Penalaran kompleks, dokumen panjang & instruksi ketat" },
  ],
  grok: [
    { id: "grok-2-latest", name: "Grok-2 (Aktif - Flagship)", desc: "Model flagship xAI terbaru dengan penalaran & pemahaman tinggi" },
    { id: "grok-2-vision-latest", name: "Grok-2 Vision (Aktif - Multimodal)", desc: "Mendukung analisis teks dan gambar/dokumen visual" },
    { id: "grok-beta", name: "Grok Beta (Aktif)", desc: "Model general knowledge cepat dari xAI" },
  ],
  deepseek: [
    { id: "deepseek-chat", name: "DeepSeek-V3 (Chat - Aktif)", desc: "Sangat cerdas, bahasa natural & hemat biaya" },
    { id: "deepseek-reasoner", name: "DeepSeek-R1 (Reasoning - Aktif)", desc: "Kemampuan penalaran matematika & logika mendalam" },
  ],
  openai: [
    { id: "gpt-4o-mini", name: "GPT-4o Mini (Aktif & Rekomendasi)", desc: "Cepat, cerdas, efisien biaya operasional" },
    { id: "gpt-4o", name: "GPT-4o (Aktif - Flagship)", desc: "Model multimodal flagship tercerdas dari OpenAI" },
    { id: "o3-mini", name: "o3-mini (Aktif - Reasoning)", desc: "Model penalaran terbaru dengan efisiensi tinggi" },
  ],
  openrouter: [
    { id: "deepseek/deepseek-chat", name: "DeepSeek-V3 (OpenRouter - Aktif)", desc: "Akses DeepSeek-V3 via OpenRouter" },
    { id: "deepseek/deepseek-r1", name: "DeepSeek-R1 (OpenRouter - Aktif)", desc: "Penalaran logika tinggi via OpenRouter" },
    { id: "x-ai/grok-2-1212", name: "xAI Grok-2 (OpenRouter - Aktif)", desc: "Akses Grok-2 via OpenRouter" },
    { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet (Aktif)", desc: "Bahasa sangat luwes dan natural" },
    { id: "openai/gpt-4o-mini", name: "GPT-4o Mini (OpenRouter - Aktif)", desc: "Akses GPT-4o Mini via OpenRouter" },
    { id: "meta-llama/llama-3.3-70b-instruct", name: "Llama 3.3 70B (Aktif)", desc: "Model open-weight terkuat" },
    { id: "google/gemini-2.0-flash-001", name: "Gemini 2.0 Flash (OpenRouter - Aktif)", desc: "Gemini 2.0 via OpenRouter" },
  ],
};

const KB_TEMPLATES = [
  {
    label: "🛍️ Toko Online / E-Commerce",
    prompt:
      "Anda adalah customer support toko online yang ramah, sopan, dan solutif. Bantu calon pembeli memilih produk, menjawab info harga, ongkir, serta cara pembayaran.",
    kb: `[PRODUK & HARGA]
- Paket Basic: Rp 99.000 (1 Akun, 1000 pesan/hari)
- Paket Pro: Rp 199.000 (3 Akun, Broadcast tanpa batas)
- Paket Enterprise: Rp 499.000 (Multi-device, Webhook, Prioritas)

[METODE PEMBAYARAN]
- Transfer Bank: BCA 1234567890 a/n WaBridge Indonesia
- QRIS: Mendukung GoPay, OVO, Dana, ShopeePay

[PENGIRIMAN & JAM KERJA]
- Pengiriman instan aktif 24/7 setelah bukti transfer diverifikasi.
- Jam CS aktif: Senin - Sabtu, 08:00 - 21:00 WIB.`,
  },
  {
    label: "🏢 Customer Support Umum",
    prompt:
      "Anda adalah AI Assistant WaBridge. Berikan informasi yang akurat, ringkas, dan jelas sesuai basis pengetahuan perusahaan.",
    kb: `[PROFIL PERUSAHAAN]
WaBridge adalah platform gateway WhatsApp API dan automasi pesan untuk bisnis di Indonesia.

[FITUR UTAMA]
1. Gateway WhatsApp multi-device (Meta Cloud API & Baileys Web).
2. Broadcast massal terjadwal.
3. Auto-reply cerdas berbasis kata kunci & integrasi AI.
4. Live Chat terpusat.`,
  },
  {
    label: "🩺 Klinik & Booking Janji Temu",
    prompt:
      "Anda adalah asisten administrasi klinik. Bantu pasien mengetahui jadwal dokter, biaya konsultasi, dan alur pendaftaran.",
    kb: `[JADWAL PRAKTIK DOKTER]
- dr. Spesialis Anak: Senin - Jumat, 09.00 - 13.00
- dr. Gigi & Mulut: Selasa & Kamis, 14.00 - 18.00
- dr. Umum: Setiap hari 24 Jam

[ALUR PENDAFTARAN]
Kirim format: Nama Pasien # No KTP # Poli Tujuan # Tanggal Kunjungan`,
  },
];

function formatPhoneNumberDisplay(num: string): string {
  const digits = num.replace(/\D/g, "");
  if (digits.startsWith("62") && digits.length >= 10) {
    return `+62 ${digits.slice(2, 5)}-${digits.slice(5, 9)}-${digits.slice(9)}`;
  }
  if (digits.startsWith("08") && digits.length >= 10) {
    return `+62 ${digits.slice(1, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
  }
  return num;
}

function isKnownModel(provider?: string, modelId?: string): boolean {
  if (!provider || !modelId) return false;
  return (PROVIDER_MODELS[provider] || []).some((m) => m.id === modelId);
}

interface Props {
  sessions: Session[];
}

export default function AiBotProfilesView({ sessions }: Props) {
  const { t } = useI18n();
  const [profiles, setProfiles] = useState<AiBotProfile[]>([]);
  const [connections, setConnections] = useState<AiConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Editor modal/view state
  const [editingProfile, setEditingProfile] = useState<AiBotProfile | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isCustomProfileModel, setIsCustomProfileModel] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Floating Toast Notification state
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  // Connection Management Modal state
  const [isConnManagerOpen, setIsConnManagerOpen] = useState(false);
  const [editingConn, setEditingConn] = useState<Partial<AiConnection> | null>(null);
  const [isCreatingConn, setIsCreatingConn] = useState(false);
  const [isCustomConnModel, setIsCustomConnModel] = useState(false);
  const [connKeyInput, setConnKeyInput] = useState("");
  const [showConnKey, setShowConnKey] = useState(false);
  const [savingConn, setSavingConn] = useState(false);
  const [testingConnId, setTestingConnId] = useState<string | null>(null);
  const [connTestResult, setConnTestResult] = useState<{
    id: string;
    success: boolean;
    message: string;
  } | null>(null);

  // Simulator state
  const [simulatorChat, setSimulatorChat] = useState<
    Array<{ role: "user" | "bot"; text: string; time: string }>
  >([
    {
      role: "bot",
      text: "Halo kak! Saya adalah asisten WhatsApp otomatis Anda. Silakan ketik pesan di bawah untuk menguji respons saya sesuai profil ini.",
      time: "10:00",
    },
  ]);
  const [testInput, setTestInput] = useState("");
  const [testingAi, setTestingAi] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [scrapingUrl, setScrapingUrl] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const kbFileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resProfiles, resConns] = await Promise.all([
        aiBotApi.listProfiles(),
        aiBotApi.listConnections(),
      ]);
      if (resProfiles.data) setProfiles(resProfiles.data);
      if (resConns.data) setConnections(resConns.data);
    } catch (e) {
      console.error("Failed to load AI bot data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [simulatorChat]);

  // Overall metrics
  const stats = useMemo(() => {
    const total = profiles.length;
    const active = profiles.filter((p) => p.isEnabled).length;
    const assignedSessionsCount = profiles.reduce(
      (acc, p) => acc + (p.sessionCount || (p.targetSessionIds || []).length || 0),
      0,
    );
    const connCount = connections.length;
    return { total, active, assignedSessionsCount, connCount };
  }, [profiles, connections]);

  // Filtered profiles
  const filteredProfiles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        p.model.toLowerCase().includes(q) ||
        p.provider.toLowerCase().includes(q) ||
        (p.connectionName && p.connectionName.toLowerCase().includes(q)),
    );
  }, [profiles, search]);

  const openNewProfile = () => {
    // Pick first connection if available
    const firstConn = connections[0];
    const newProf: AiBotProfile = {
      id: "",
      name: `Profil AI #${profiles.length + 1}`,
      description: "Asisten otomatis untuk sesi tertentu",
      isEnabled: true,
      connectionId: firstConn?.id,
      connectionName: firstConn?.name,
      provider: firstConn?.provider || "gemini",
      apiKey: "",
      apiKeyMasked: firstConn?.apiKeyMasked || "",
      hasKey: !!firstConn?.hasKey,
      model: firstConn?.defaultModel || "gemini-3.6-flash",
      systemPrompt:
        "Anda adalah asisten virtual WhatsApp yang ramah, profesional, dan membantu. Jawab pertanyaan pengguna dengan jelas, sopan, dan ringkas dalam Bahasa Indonesia.",
      knowledgeBase: "",
      handoverKeywords: ["cs", "admin", "human", "manusia", "bantuan", "operator"],
      handoverMessage:
        "Baik kak, pesan Anda telah dialihkan ke Tim Customer Service (Manusia). Mohon tunggu sebentar ya kak.",
      handoverDurationMinutes: 120,
      targetSessionIds: [],
      scheduleMode: "always",
      workHoursStart: "08:00",
      workHoursEnd: "17:00",
      workDays: [1, 2, 3, 4, 5],
      temperature: 0.7,
      maxTokens: 500,
      contextWindow: 8,
      senderFilterMode: "all",
      whitelistNumbers: [],
      blacklistNumbers: [],
      ignoreGroups: true,
    };
    setEditingProfile(newProf);
    setIsCreatingNew(true);
    setIsCustomProfileModel(!isKnownModel(newProf.provider, newProf.model));
    setKeyInput("");
    setShowKey(false);
    setPhoneInput("");
    setSaveSuccessMsg("");
    setSimulatorChat([
      {
        role: "bot",
        text: "Halo kak! Saya adalah asisten WhatsApp otomatis Anda. Silakan ketik pesan di bawah untuk menguji respons saya sesuai profil baru ini.",
        time: "10:00",
      },
    ]);
  };

  const openEditProfile = (p: AiBotProfile) => {
    let initialConnId = p.connectionId;
    if (!initialConnId) {
      const match = connections.find((c) => c.provider === p.provider);
      if (match) initialConnId = match.id;
    }
    const matchedConn = connections.find((c) => c.id === initialConnId);

    setEditingProfile({
      ...p,
      connectionId: initialConnId,
      connectionName: matchedConn?.name || p.connectionName,
      scheduleMode: p.scheduleMode || "always",
      workHoursStart: p.workHoursStart || "08:00",
      workHoursEnd: p.workHoursEnd || "17:00",
      workDays: p.workDays || [1, 2, 3, 4, 5],
      temperature: p.temperature ?? 0.7,
      maxTokens: p.maxTokens ?? 500,
      contextWindow: p.contextWindow ?? 8,
    });
    setIsCreatingNew(false);
    setIsCustomProfileModel(!isKnownModel(p.provider, p.model));
    setKeyInput("");
    setShowKey(false);
    setPhoneInput("");
    setSaveSuccessMsg("");
    setSimulatorChat([
      {
        role: "bot",
        text: `Halo kak! Saya adalah asisten WhatsApp otomatis untuk profil "${p.name}". Silakan uji respons saya di sini.`,
        time: "10:00",
      },
    ]);
  };

  const closeEditor = () => {
    setEditingProfile(null);
    setIsCreatingNew(false);
    setIsCustomProfileModel(false);
    setKeyInput("");
    setPhoneInput("");
    setSaveSuccessMsg("");
  };

  // ── Connection Management Handlers ──────────────────────────────────────────

  const openNewConnection = () => {
    setEditingConn({
      name: `Akun AI #${connections.length + 1}`,
      provider: "gemini",
      defaultModel: "gemini-3.6-flash",
      apiKey: "",
    });
    setIsCreatingConn(true);
    setIsCustomConnModel(false);
    setConnKeyInput("");
    setShowConnKey(false);
    setConnTestResult(null);
  };

  const openEditConnection = (conn: AiConnection) => {
    setEditingConn({ ...conn });
    setIsCreatingConn(false);
    setIsCustomConnModel(!isKnownModel(conn.provider, conn.defaultModel));
    setConnKeyInput("");
    setShowConnKey(false);
    setConnTestResult(null);
  };

  const handleSaveConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConn) return;
    setSavingConn(true);

    try {
      const payload: Partial<AiConnection> = {
        name: editingConn.name,
        provider: editingConn.provider,
        defaultModel: editingConn.defaultModel,
      };
      if (connKeyInput.trim()) {
        payload.apiKey = connKeyInput.trim();
      }

      let saved: AiConnection | null = null;
      if (isCreatingConn) {
        if (!connKeyInput.trim()) {
          showToast("Silakan masukkan API Key untuk akun AI baru.", "error");
          setSavingConn(false);
          return;
        }
        payload.apiKey = connKeyInput.trim();
        const res = await aiBotApi.createConnection(payload);
        if (res.data) saved = res.data;
      } else if (editingConn.id) {
        const res = await aiBotApi.updateConnection(editingConn.id, payload);
        if (res.data) saved = res.data;
      }

      if (saved) {
        // Refresh connections
        const resConns = await aiBotApi.listConnections();
        if (resConns.data) setConnections(resConns.data);

        // If editingProfile was open, we can select this saved connection
        if (editingProfile) {
          setEditingProfile({
            ...editingProfile,
            connectionId: saved.id,
            connectionName: saved.name,
            provider: saved.provider,
            model: saved.defaultModel,
          });
        }

        setEditingConn(null);
        setIsCreatingConn(false);
        setConnKeyInput("");
        showToast("Akun AI berhasil disimpan!", "success");
      }
    } catch (err: any) {
      showToast(`Gagal menyimpan akun AI: ${err?.message || "Kesalahan server"}`, "error");
    } finally {
      setSavingConn(false);
    }
  };

  const handleDeleteConnection = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus akun AI ini? Profil yang menggunakan akun ini perlu memilih akun lain.")) {
      return;
    }
    try {
      await aiBotApi.deleteConnection(id);
      const resConns = await aiBotApi.listConnections();
      if (resConns.data) setConnections(resConns.data);
      if (editingProfile?.connectionId === id) {
        setEditingProfile({ ...editingProfile, connectionId: undefined, connectionName: undefined });
      }
      showToast("Akun AI berhasil dihapus.", "info");
    } catch (err: any) {
      showToast(`Gagal menghapus akun AI: ${err?.message}`, "error");
    }
  };

  const handleTestConnectionLive = async (connId?: string, prov?: string, model?: string, key?: string) => {
    const targetId = connId || editingConn?.id || "temp";
    setTestingConnId(targetId);
    setConnTestResult(null);

    try {
      const res = await aiBotApi.testConnection({
        connectionId: connId,
        provider: prov || editingConn?.provider,
        model: model || editingConn?.defaultModel,
        apiKey: key || (connKeyInput.trim() || undefined),
      });

      if (res.data?.success) {
        setConnTestResult({
          id: targetId,
          success: true,
          message: res.data.reply || "Koneksi API valid dan responsif!",
        });
      } else {
        const errorDetail = (res.data as any)?.error || (res as any)?.message || "API merespons dengan kesalahan.";
        setConnTestResult({
          id: targetId,
          success: false,
          message: errorDetail,
        });
      }
    } catch (err: any) {
      const errorDetail =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Gagal menghubungi provider AI. Periksa API Key.";
      setConnTestResult({
        id: targetId,
        success: false,
        message: errorDetail,
      });
    } finally {
      setTestingConnId(null);
    }
  };

  // ── Phone Number Filter Handlers ──────────────────────────────────────────

  const handleAddPhoneNumber = () => {
    if (!editingProfile || !phoneInput.trim()) return;
    const rawList = phoneInput
      .split(/[\s,;\n]+/)
      .map((s) => s.trim().replace(/[^\d+]/g, ""))
      .filter(Boolean);

    if (rawList.length === 0) return;

    const mode = editingProfile.senderFilterMode || "whitelist";
    const targetKey = mode === "whitelist" ? "whitelistNumbers" : "blacklistNumbers";
    const current = editingProfile[targetKey] || [];

    const added: string[] = [];
    for (let num of rawList) {
      if (num.startsWith("08")) num = "62" + num.slice(1);
      if (num.startsWith("+")) num = num.slice(1);
      if (!current.includes(num) && !added.includes(num)) {
        added.push(num);
      }
    }

    setEditingProfile({
      ...editingProfile,
      [targetKey]: [...current, ...added],
    });
    setPhoneInput("");
  };

  const handleRemovePhoneNumber = (num: string) => {
    if (!editingProfile) return;
    const mode = editingProfile.senderFilterMode || "whitelist";
    const targetKey = mode === "whitelist" ? "whitelistNumbers" : "blacklistNumbers";
    const current = editingProfile[targetKey] || [];
    setEditingProfile({
      ...editingProfile,
      [targetKey]: current.filter((n) => n !== num),
    });
  };

  const handleClearAllPhoneNumbers = () => {
    if (!editingProfile) return;
    const mode = editingProfile.senderFilterMode || "whitelist";
    const targetKey = mode === "whitelist" ? "whitelistNumbers" : "blacklistNumbers";
    setEditingProfile({
      ...editingProfile,
      [targetKey]: [],
    });
  };

  // ── Profile Handlers ──────────────────────────────────────────────────────

  const handleToggleActive = async (p: AiBotProfile) => {
    try {
      const res = await aiBotApi.toggleProfile(p.id);
      if (res.data) {
        setProfiles((prev) =>
          prev.map((item) => (item.id === p.id ? { ...item, isEnabled: res.data!.isEnabled } : item)),
        );
      }
    } catch (e) {
      console.error("Toggle error", e);
    }
  };

  const handleDuplicate = async (p: AiBotProfile) => {
    try {
      const res = await aiBotApi.duplicateProfile(p.id);
      if (res.data) {
        await loadData();
        openEditProfile(res.data);
      }
    } catch (e) {
      console.error("Duplicate error", e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await aiBotApi.deleteProfile(id);
      if (res.data?.success) {
        setDeleteConfirmId(null);
        if (editingProfile?.id === id) closeEditor();
        await loadData();
      }
    } catch (e) {
      console.error("Delete error", e);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile) return;
    setSaving(true);
    setSaveSuccessMsg("");

    try {
      const payload: Partial<AiBotProfile> = {
        name: editingProfile.name,
        description: editingProfile.description,
        isEnabled: editingProfile.isEnabled,
        connectionId: editingProfile.connectionId || undefined,
        provider: editingProfile.provider,
        model: editingProfile.model,
        systemPrompt: editingProfile.systemPrompt,
        knowledgeBase: editingProfile.knowledgeBase,
        handoverKeywords: editingProfile.handoverKeywords,
        handoverMessage: editingProfile.handoverMessage,
        handoverDurationMinutes: editingProfile.handoverDurationMinutes,
        targetSessionIds: editingProfile.targetSessionIds,
        scheduleMode: editingProfile.scheduleMode,
        workHoursStart: editingProfile.workHoursStart,
        workHoursEnd: editingProfile.workHoursEnd,
        workDays: editingProfile.workDays,
        temperature: editingProfile.temperature,
        maxTokens: editingProfile.maxTokens,
        contextWindow: editingProfile.contextWindow,
        senderFilterMode: editingProfile.senderFilterMode || "all",
        whitelistNumbers: editingProfile.whitelistNumbers || [],
        blacklistNumbers: editingProfile.blacklistNumbers || [],
        ignoreGroups: editingProfile.ignoreGroups !== false,
      };

      if (keyInput.trim()) {
        payload.apiKey = keyInput.trim();
      }

      let saved: AiBotProfile | null = null;
      if (isCreatingNew) {
        const res = await aiBotApi.createProfile(payload);
        if (res.data) saved = res.data;
      } else {
        const res = await aiBotApi.updateProfile(editingProfile.id, payload);
        if (res.data) saved = res.data;
      }

      if (saved) {
        setSaveSuccessMsg("Profil AI berhasil disimpan!");
        showToast("Profil AI berhasil disimpan!", "success");
        setKeyInput("");
        await loadData();
        setTimeout(() => setSaveSuccessMsg(""), 3500);
        if (isCreatingNew) {
          setIsCreatingNew(false);
          setEditingProfile(saved);
        }
      }
    } catch (err: any) {
      console.error("Save profile error", err);
      showToast(`Gagal menyimpan profil AI: ${err?.message || "Kesalahan server"}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSendSimulator = async (e?: React.FormEvent, customMsg?: string) => {
    if (e) e.preventDefault();
    const msgToSend = customMsg || testInput;
    if (!msgToSend.trim() || testingAi) return;

    const timeStr = new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

    setSimulatorChat((prev) => [
      ...prev,
      { role: "user", text: msgToSend.trim(), time: timeStr },
    ]);
    if (!customMsg) setTestInput("");
    setTestingAi(true);

    try {
      const targetId = editingProfile?.id || "temp-test";
      const draftPayload = editingProfile
        ? {
            ...editingProfile,
            connectionId: editingProfile.connectionId || null,
            apiKey: keyInput.trim() || undefined,
          }
        : undefined;

      const chatHistory = simulatorChat
        .filter((m) => m.role === "user" || m.role === "bot")
        .map((m) => ({
          role: (m.role === "bot" ? "assistant" : "user") as "user" | "assistant",
          content: m.text,
        }));

      const res = await aiBotApi.testProfile(targetId, msgToSend.trim(), draftPayload, chatHistory);
      const replyText =
        res.data?.reply ||
        (res as any)?.reply ||
        "Maaf, AI tidak memberikan respons atau API key belum valid.";
      setSimulatorChat((prev) => [
        ...prev,
        {
          role: "bot",
          text: replyText,
          time: new Date().toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Periksa Akun AI atau API Key";
      setSimulatorChat((prev) => [
        ...prev,
        {
          role: "bot",
          text: `⚠️ Gagal: ${errMsg}`,
          time: new Date().toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } finally {
      setTestingAi(false);
    }
  };

  const handleKbFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingProfile) return;
    setUploadingDoc(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string) || "";
        const res = await aiBotApi.parseDocument(base64, file.name);
        const extractedText = res.data?.text;
        if (extractedText) {
          setEditingProfile((prev) =>
            prev
              ? {
                  ...prev,
                  knowledgeBase: prev.knowledgeBase
                    ? `${prev.knowledgeBase}\n\n[DOKUMEN: ${file.name}]\n${extractedText}`
                    : `[DOKUMEN: ${file.name}]\n${extractedText}`,
                }
              : null,
          );
          showToast(`Dokumen "${file.name}" berhasil dipelajari!`, "success");
        }
      } catch (err: any) {
        showToast(`Gagal memproses dokumen: ${err?.message || "Format berkas tidak didukung"}`, "error");
      } finally {
        setUploadingDoc(false);
      }
    };
    reader.onerror = () => setUploadingDoc(false);
    reader.readAsDataURL(file);
    if (kbFileInputRef.current) kbFileInputRef.current.value = "";
  };

  const handleScrapeWebUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim() || scrapingUrl) return;
    setScrapingUrl(true);
    try {
      const res = await aiBotApi.scrapeUrl(urlInput.trim());
      const data = res.data;
      if (data?.text) {
        setEditingProfile((prev) =>
          prev
            ? {
                ...prev,
                knowledgeBase: prev.knowledgeBase
                  ? `${prev.knowledgeBase}\n\n--- KNOWLEDGE BASE WEB (${data.url}) ---\n${data.text}`
                  : `--- KNOWLEDGE BASE WEB (${data.url}) ---\n${data.text}`,
              }
            : null,
        );
        showToast(
          `Berhasil membaca informasi website! (${data.length} karakter)`,
          "success",
        );
        setShowUrlModal(false);
        setUrlInput("");
      }
    } catch (err: any) {
      showToast(`Gagal membaca URL website: ${err?.message || "Kesalahan jaringan"}`, "error");
    } finally {
      setScrapingUrl(false);
    }
  };

  const toggleSessionBinding = (sessionId: string) => {
    if (!editingProfile) return;
    const current = editingProfile.targetSessionIds || [];
    let updated: string[] = [];
    if (current.includes(sessionId)) {
      updated = current.filter((id) => id !== sessionId);
    } else {
      updated = [...current, sessionId];
    }
    setEditingProfile({ ...editingProfile, targetSessionIds: updated });
  };

  return (
    <div className="space-y-5">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="card p-3 sm:p-4 bg-gray-900/60 border-gray-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Total Profil AI</p>
            <p className="text-lg sm:text-xl font-bold text-white">{stats.total}</p>
          </div>
        </div>

        <div className="card p-3 sm:p-4 bg-gray-900/60 border-gray-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Profil Aktif</p>
            <p className="text-lg sm:text-xl font-bold text-emerald-400">{stats.active}</p>
          </div>
        </div>

        <div className="card p-3 sm:p-4 bg-gray-900/60 border-gray-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Sesi Terhubung</p>
            <p className="text-lg sm:text-xl font-bold text-blue-300">{stats.assignedSessionsCount}</p>
          </div>
        </div>

        <div className="card p-3 sm:p-4 bg-gray-900/60 border-gray-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Akun AI Terdaftar</p>
            <p className="text-lg sm:text-xl font-bold text-indigo-300">{stats.connCount}</p>
          </div>
        </div>
      </div>

      {/* Action & Filter Bar */}
      <div className="card p-4 bg-gray-900/40 border-gray-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari profil AI berdasarkan nama, model, provider, akun..."
            className="input pl-9 pr-8 text-xs py-2 w-full bg-gray-950/60 border-gray-800 focus:border-brand-500"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => void loadData()}
            disabled={loading}
            className="btn-secondary text-xs"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>

          {/* Button: Kelola Akun AI */}
          <button
            onClick={() => setIsConnManagerOpen(true)}
            className="btn-secondary text-xs flex items-center gap-1.5 border-indigo-500/30 hover:border-indigo-500/60 bg-indigo-950/20 text-indigo-300 hover:text-white"
          >
            <Key className="w-3.5 h-3.5 text-indigo-400" />
            <span>Kelola Akun AI</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300 font-mono">
              {connections.length}
            </span>
          </button>

          {/* Button: Tambah Profil AI */}
          <button
            onClick={openNewProfile}
            className="btn-primary text-xs shadow-lg shadow-brand-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Profil AI</span>
          </button>
        </div>
      </div>

      {/* Grid of Profiles */}
      {loading ? (
        <div className="card p-16 flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-gray-500 animate-spin" />
        </div>
      ) : filteredProfiles.length === 0 ? (
        <div className="card p-12 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Belum Ada Profil AI</h3>
            <p className="text-xs text-gray-400 max-w-md mt-1">
              Buat profil AI pertama Anda untuk mengatur aturan prompt, knowledge base FAQ, dan target nomor WhatsApp yang ingin dibalas.
            </p>
          </div>
          <button onClick={openNewProfile} className="btn-primary text-xs mt-2 shadow-lg shadow-brand-500/20">
            <Plus className="w-3.5 h-3.5" />
            <span>Buat Profil AI Pertama</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProfiles.map((p) => {
            const hasAssignedSessions = (p.sessionCount || 0) > 0 || (p.targetSessionIds || []).length > 0;
            return (
              <div
                key={p.id}
                className={`card p-4 sm:p-5 space-y-4 border transition-all relative overflow-hidden flex flex-col justify-between ${
                  p.isEnabled
                    ? "bg-gray-900/60 border-purple-500/30 hover:border-purple-500/60"
                    : "bg-gray-900/30 border-gray-800/80 opacity-80 hover:opacity-100"
                }`}
              >
                {/* Header card */}
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-100 text-sm leading-tight hover:text-white transition-colors">
                          {p.name}
                        </h3>
                        <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
                          {p.description || "Tidak ada deskripsi"}
                        </p>
                      </div>
                    </div>

                    {/* Active toggle */}
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={p.isEnabled}
                        onChange={() => void handleToggleActive(p)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600" />
                    </label>
                  </div>

                  {/* Badges: Provider, Model, Account & Target */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-950 border border-gray-800 text-gray-300 font-mono">
                      {p.provider.toUpperCase()} · {p.model}
                    </span>

                    {p.connectionName ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-950/50 text-indigo-300 border border-indigo-800/60 flex items-center gap-1">
                        <Key className="w-3 h-3 text-indigo-400" />
                        <span>{p.connectionName}</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-950 text-gray-400 border border-gray-800">
                        Kunci Manual
                      </span>
                    )}

                    {p.senderFilterMode === "whitelist" ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/40 text-emerald-300 border border-emerald-800/60 flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-emerald-400" />
                        <span>Whitelist ({(p.whitelistNumbers || []).length} No)</span>
                      </span>
                    ) : p.senderFilterMode === "blacklist" ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-950/40 text-red-300 border border-red-800/60 flex items-center gap-1">
                        <UserX className="w-3 h-3 text-red-400" />
                        <span>Blacklist ({(p.blacklistNumbers || []).length} No)</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-950 text-gray-400 border border-gray-800 flex items-center gap-1">
                        <Users className="w-3 h-3 text-gray-500" />
                        <span>Semua Nomor</span>
                      </span>
                    )}

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        hasAssignedSessions
                          ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/60"
                          : "bg-gray-800/60 text-gray-400 border-gray-700/60"
                      }`}
                    >
                      🔗 {p.sessionCount || (p.targetSessionIds || []).length} Sesi
                    </span>
                  </div>
                </div>

                {/* Prompt Preview */}
                <div className="bg-gray-950/60 p-2.5 rounded-xl border border-gray-800/60 text-xs text-gray-400 line-clamp-2 italic">
                  "{p.systemPrompt}"
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-800/80">
                  <button
                    onClick={() => openEditProfile(p)}
                    className="btn-primary text-xs flex-1 justify-center py-1.5 shadow-md shadow-brand-500/10"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Kelola & Edit</span>
                  </button>
                  <button
                    onClick={() => void handleDuplicate(p)}
                    className="p-1.5 rounded-lg border border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                    title="Duplikat Profil"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(p.id)}
                    className="p-1.5 rounded-lg border border-gray-800 text-red-400 hover:text-red-300 hover:bg-red-950/40 hover:border-red-800/50 transition-colors"
                    title="Hapus Profil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="card w-full max-w-sm p-5 space-y-4 shadow-2xl border-gray-750">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-950/60 text-red-400 flex items-center justify-center border border-red-800/50">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Hapus Profil AI?</h3>
                <p className="text-xs text-gray-400">
                  Sesi yang terhubung ke profil ini tidak akan lagi dibalas otomatis oleh AI.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                Batal
              </button>
              <button
                onClick={() => void handleDelete(deleteConfirmId)}
                className="btn-danger text-xs px-3 py-1.5"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Kelola Akun & Kredensial AI Provider ─────────────────────────── */}
      {isConnManagerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="card w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border-gray-750 my-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-gray-900/90">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Daftar Akun & Kredensial AI</h3>
                  <p className="text-xs text-gray-400">
                    Daftarkan API Key sekali saja. Anda dapat memilih akun ini saat membuat aturan/profil AI baru.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsConnManagerOpen(false);
                  setEditingConn(null);
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content List */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 bg-gray-950/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400">
                  {connections.length} Akun Provider AI Terdaftar
                </span>
                <button
                  onClick={openNewConnection}
                  className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-md shadow-brand-500/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Daftarkan Akun AI Baru</span>
                </button>
              </div>

              {/* Status Message from Testing */}
              {connTestResult && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in ${
                    connTestResult.success
                      ? "bg-emerald-950/40 border-emerald-800/80 text-emerald-300"
                      : "bg-red-950/40 border-red-800/80 text-red-300"
                  }`}
                >
                  {connTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <strong className="block font-semibold">
                      {connTestResult.success ? "Uji Koneksi Berhasil" : "Uji Koneksi Gagal"}
                    </strong>
                    <span className="text-[11px] opacity-90">{connTestResult.message}</span>
                  </div>
                  <button
                    onClick={() => setConnTestResult(null)}
                    className="text-gray-400 hover:text-white p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Connections Cards Grid */}
              {connections.length === 0 ? (
                <div className="card p-8 text-center space-y-3 bg-gray-900/30 border-dashed border-gray-800">
                  <div className="w-10 h-10 mx-auto rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <Key className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-gray-400">
                    Belum ada akun AI yang didaftarkan. Tambahkan akun Google Gemini, xAI Grok, atau DeepSeek sekarang.
                  </p>
                  <button
                    onClick={openNewConnection}
                    className="btn-primary text-xs mx-auto py-1.5 px-3"
                  >
                    + Daftarkan Akun Pertama
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {connections.map((c) => (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-xl bg-gray-900/70 border border-gray-800 hover:border-gray-700 space-y-2.5 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono border ${
                              c.provider === "gemini"
                                ? "bg-blue-950/60 text-blue-300 border-blue-800/60"
                                : c.provider === "grok"
                                ? "bg-zinc-900 text-zinc-100 border-zinc-700"
                                : c.provider === "deepseek"
                                ? "bg-cyan-950/60 text-cyan-300 border-cyan-800/60"
                                : c.provider === "openai"
                                ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/60"
                                : "bg-orange-950/60 text-orange-300 border-orange-800/60"
                            }`}
                          >
                            {c.provider}
                          </span>
                          <h4 className="text-xs font-bold text-white truncate max-w-[150px]">
                            {c.name}
                          </h4>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditConnection(c)}
                            className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-800"
                            title="Edit Akun"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => void handleDeleteConnection(c.id)}
                            className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-950/50"
                            title="Hapus Akun"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1 text-[11px] font-mono">
                        <div className="flex items-center justify-between text-gray-400">
                          <span>Model Default:</span>
                          <span className="text-gray-200">{c.defaultModel}</span>
                        </div>
                        <div className="flex items-center justify-between text-gray-400">
                          <span>API Key:</span>
                          <span className="text-emerald-400 font-semibold">{c.apiKeyMasked || "Belum ada"}</span>
                        </div>
                      </div>

                      <div className="pt-1.5 border-t border-gray-800/70 flex items-center justify-between">
                        <span className="text-[10px] text-gray-500">
                          ID: {c.id.slice(0, 12)}
                        </span>
                        <button
                          type="button"
                          disabled={testingConnId === c.id}
                          onClick={() => void handleTestConnectionLive(c.id, c.provider, c.defaultModel)}
                          className="btn-secondary text-[10px] py-1 px-2.5 flex items-center gap-1"
                        >
                          {testingConnId === c.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin text-purple-400" />
                          ) : (
                            <Play className="w-3 h-3 text-emerald-400" />
                          )}
                          <span>{testingConnId === c.id ? "Menguji..." : "Uji Koneksi"}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-800 bg-gray-900/60 flex justify-end">
              <button
                onClick={() => {
                  setIsConnManagerOpen(false);
                  setEditingConn(null);
                }}
                className="btn-secondary text-xs px-4 py-1.5"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sub-Modal: Tambah / Edit Akun AI Provider ──────────────────────────── */}
      {editingConn && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="card w-full max-w-md p-5 space-y-4 shadow-2xl border-gray-750">
            <div className="flex items-center justify-between pb-2 border-b border-gray-800">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-400" />
                <span>{isCreatingConn ? "Daftarkan Akun AI Baru" : `Edit Akun: ${editingConn.name}`}</span>
              </h4>
              <button
                onClick={() => setEditingConn(null)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveConnection} className="space-y-3.5">
              <div>
                <label className="label">Nama Akun / Label *</label>
                <input
                  type="text"
                  required
                  value={editingConn.name || ""}
                  onChange={(e) => setEditingConn({ ...editingConn, name: e.target.value })}
                  placeholder="Cth: Google Gemini Utama, xAI Grok Bisnis"
                  className="input text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="label">AI Provider</label>
                  <select
                    className="input text-xs"
                    value={editingConn.provider || "gemini"}
                    onChange={(e) => {
                      const newProv = e.target.value as any;
                      const defMod = PROVIDER_MODELS[newProv]?.[0]?.id || "gemini-3.6-flash";
                      setEditingConn({
                        ...editingConn,
                        provider: newProv,
                        defaultModel: defMod,
                      });
                    }}
                  >
                    <option value="gemini">Google Gemini</option>
                    <option value="grok">xAI Grok</option>
                    <option value="deepseek">DeepSeek AI</option>
                    <option value="openai">OpenAI (ChatGPT)</option>
                    <option value="openrouter">OpenRouter</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between pb-1">
                    <label className="label mb-0">Model Default</label>
                    <button
                      type="button"
                      onClick={() => setIsCustomConnModel(!isCustomConnModel)}
                      className="text-[10px] text-purple-400 hover:text-purple-300 font-medium transition-colors"
                    >
                      {isCustomConnModel ? "← Pilih dari Daftar" : "+ Ketik ID Model Manual"}
                    </button>
                  </div>
                  {isCustomConnModel ? (
                    <div>
                      <input
                        type="text"
                        required
                        value={editingConn.defaultModel || ""}
                        onChange={(e) =>
                          setEditingConn({ ...editingConn, defaultModel: e.target.value.trim() })
                        }
                        placeholder={
                          editingConn.provider === "openrouter"
                            ? "Cth: anthropic/claude-3.7-sonnet"
                            : "Cth: nama-model-kustom"
                        }
                        className="input text-xs font-mono"
                      />
                      <p className="text-[10px] text-gray-500 mt-1">
                        Ketik ID model persis seperti di dashboard provider (misal: <code>penyedia/model-id</code>).
                      </p>
                    </div>
                  ) : (
                    <select
                      className="input text-xs"
                      value={
                        isKnownModel(editingConn.provider, editingConn.defaultModel)
                          ? editingConn.defaultModel
                          : "__custom__"
                      }
                      onChange={(e) => {
                        if (e.target.value === "__custom__") {
                          setIsCustomConnModel(true);
                        } else {
                          setEditingConn({ ...editingConn, defaultModel: e.target.value });
                        }
                      }}
                    >
                      {(PROVIDER_MODELS[editingConn.provider || "gemini"] || []).map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                      <option value="__custom__">➕ Ketik ID Model Manual (Custom)...</option>
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="label flex items-center justify-between">
                  <span>API Key {editingConn.provider?.toUpperCase()} *</span>
                  {editingConn.apiKeyMasked && (
                    <span className="text-[10px] text-emerald-400">
                      Tersimpan: {editingConn.apiKeyMasked}
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type={showConnKey ? "text" : "password"}
                    value={connKeyInput}
                    onChange={(e) => setConnKeyInput(e.target.value)}
                    placeholder={
                      isCreatingConn
                        ? editingConn.provider === "gemini"
                          ? "Masukkan API Key Google AI Studio (berawalan AIzaSy...)"
                          : "Masukkan API Key dari dashboard provider..."
                        : "Biarkan kosong jika tidak ingin mengubah key"
                    }
                    className="input text-xs pr-10 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConnKey(!showConnKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showConnKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {editingConn.provider === "gemini" && (
                  <p className="text-[10px] text-amber-400/90 mt-1">
                    ℹ️ Gunakan API Key dari <strong>aistudio.google.com</strong> (wajib diawali <code>AIzaSy...</code>). Token OAuth atau key Google Cloud IAM akan ditolak.
                  </p>
                )}
                {editingConn.provider === "openrouter" && (
                  <p className="text-[10px] text-gray-400 mt-1">
                    ℹ️ Gunakan API Key dari <strong>openrouter.ai/keys</strong>. Model <code>:free</code> sering mengalami antrean / limit upstream (429).
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                <button
                  type="button"
                  disabled={testingConnId === "temp"}
                  onClick={() =>
                    void handleTestConnectionLive(
                      editingConn.id,
                      editingConn.provider,
                      editingConn.defaultModel,
                      connKeyInput.trim() || undefined,
                    )
                  }
                  className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                >
                  {testingConnId === "temp" ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>Tes Kunci</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingConn(null)}
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={savingConn}
                    className="btn-primary text-xs py-1.5 px-4 font-semibold"
                  >
                    {savingConn ? "Menyimpan..." : "Simpan Akun AI"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Profile Studio / Full Editor Modal ─────────────────────────────────── */}
      {editingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="card w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden shadow-2xl border-gray-750 my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-gray-900/80">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white leading-tight">
                    {isCreatingNew ? "Buat Profil AI Baru" : `Edit Profil: ${editingProfile.name}`}
                  </h2>
                  <p className="text-xs text-gray-400">
                    Atur instruksi, knowledge base FAQ, target nomor pengirim, dan tautkan ke sesi WhatsApp pilihan.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {saveSuccessMsg && (
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-semibold animate-in fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{saveSuccessMsg}</span>
                  </span>
                )}
                <button
                  onClick={closeEditor}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content - 2 Columns */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-gray-950/40">
              {/* Left Column: Settings Form (7 cols) */}
              <div className="lg:col-span-7 space-y-5">
                <form onSubmit={handleSaveProfile} className="space-y-5">
                  {/* Basic Profile Info */}
                  <div className="card p-4 space-y-3.5 bg-gray-900/50 border-gray-800">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-800/80">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Identitas Profil AI
                      </span>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-xs text-gray-300 font-medium">
                          {editingProfile.isEnabled ? "Status: Aktif" : "Status: Nonaktif"}
                        </span>
                        <input
                          type="checkbox"
                          checked={editingProfile.isEnabled}
                          onChange={(e) =>
                            setEditingProfile({ ...editingProfile, isEnabled: e.target.checked })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600 relative" />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="label">Nama Profil *</label>
                        <input
                          type="text"
                          required
                          value={editingProfile.name}
                          onChange={(e) =>
                            setEditingProfile({ ...editingProfile, name: e.target.value })
                          }
                          placeholder="Cth: CS Sales Toko"
                          className="input text-xs"
                        />
                      </div>
                      <div>
                        <label className="label">Deskripsi Singkat</label>
                        <input
                          type="text"
                          value={editingProfile.description || ""}
                          onChange={(e) =>
                            setEditingProfile({ ...editingProfile, description: e.target.value })
                          }
                          placeholder="Cth: Menjawab info produk dan harga"
                          className="input text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sesi WhatsApp Binding */}
                  <div className="card p-4 space-y-3 bg-gray-900/50 border-gray-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-white uppercase tracking-wider block">
                          Tautkan Sesi WhatsApp
                        </span>
                        <span className="text-[11px] text-gray-400">
                          Pilih sesi yang akan menggunakan aturan profil AI ini:
                        </span>
                      </div>
                      <span className="text-xs text-purple-400 font-semibold">
                        {(editingProfile.targetSessionIds || []).length} Dipilih
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1">
                      {sessions.length === 0 ? (
                        <p className="text-xs text-gray-500 italic col-span-2">
                          Belum ada sesi WhatsApp yang terdaftar. Buat sesi di menu Sesi WhatsApp.
                        </p>
                      ) : (
                        sessions.map((s) => {
                          const isChecked = (editingProfile.targetSessionIds || []).includes(s.id);
                          return (
                            <label
                              key={s.id}
                              className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                                isChecked
                                  ? "bg-purple-950/40 border-purple-800/60 text-white font-medium"
                                  : "bg-gray-950/40 border-gray-800/70 text-gray-400 hover:border-gray-700"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleSessionBinding(s.id)}
                                className="rounded bg-gray-900 border-gray-700 text-purple-600 focus:ring-0"
                              />
                              <span className="truncate">{s.name}</span>
                              <span className="text-[10px] text-gray-500 ml-auto font-mono">
                                {s.providerType}
                              </span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* AI Provider & Model (Akun Terdaftar vs Manual) */}
                  <div className="card p-4 space-y-3.5 bg-gray-900/50 border-gray-800">
                    <div className="flex items-center justify-between pb-1 border-b border-gray-800/80">
                      <div>
                        <span className="text-xs font-bold text-white uppercase tracking-wider block">
                          Provider & Model AI
                        </span>
                        <span className="text-[11px] text-gray-400">
                          Pilih akun AI yang sudah terdaftar tanpa perlu mengetik ulang API key.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={openNewConnection}
                        className="btn-secondary text-[11px] py-1 px-2.5 flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5 text-purple-400" />
                        <span>+ Akun AI Baru</span>
                      </button>
                    </div>

                    {/* Connection Selector (Akun AI Resmi - Kredensial Terpusat) */}
                    <div>
                      <div className="flex items-center justify-between pb-1.5">
                        <label className="label mb-0 text-xs font-semibold text-gray-200">
                          Akun AI (Provider & Kredensial API)
                        </label>
                        <button
                          type="button"
                          onClick={openNewConnection}
                          className="text-[11px] text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Tambah Akun AI Baru</span>
                        </button>
                      </div>

                      {connections.length === 0 ? (
                        <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-800/40 flex items-center justify-between">
                          <div className="text-xs text-purple-300">
                            Belum ada Akun AI yang didaftarkan.
                          </div>
                          <button
                            type="button"
                            onClick={openNewConnection}
                            className="btn-primary text-xs py-1 px-3"
                          >
                            + Daftarkan Akun AI
                          </button>
                        </div>
                      ) : (
                        <select
                          className="input text-xs font-medium bg-gray-900 border-gray-700"
                          value={editingProfile.connectionId || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const conn = connections.find((c) => c.id === val);
                            if (conn) {
                              setEditingProfile({
                                ...editingProfile,
                                connectionId: conn.id,
                                connectionName: conn.name,
                                provider: conn.provider,
                                model: conn.defaultModel || PROVIDER_MODELS[conn.provider]?.[0]?.id || "gemini-3.6-flash",
                                hasKey: conn.hasKey,
                                apiKeyMasked: conn.apiKeyMasked,
                              });
                            } else {
                              setEditingProfile({
                                ...editingProfile,
                                connectionId: undefined,
                                connectionName: undefined,
                                hasKey: false,
                                apiKeyMasked: "",
                              });
                            }
                          }}
                        >
                          <option value="">-- Pilih Akun AI untuk Profil Ini --</option>
                          {connections.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.provider.toUpperCase()} · Model: {c.defaultModel} · Key: {c.apiKeyMasked})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Active Connection Badge & Model Selection */}
                    {editingProfile.connectionId && (
                      <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-800/40 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-purple-300 font-medium flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            Terhubung ke Akun: <strong className="text-white">{connections.find((c) => c.id === editingProfile.connectionId)?.name}</strong>
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-900/60 text-purple-200 border border-purple-700/50 uppercase font-mono font-bold tracking-wider">
                            {editingProfile.provider}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center justify-between pb-1">
                            <label className="label text-[11px] mb-0 font-medium">Model AI untuk Profil Ini</label>
                            <button
                              type="button"
                              onClick={() => setIsCustomProfileModel(!isCustomProfileModel)}
                              className="text-[10px] text-purple-400 hover:text-purple-300 font-medium transition-colors"
                            >
                              {isCustomProfileModel ? "← Pilih dari Daftar" : "+ Ketik ID Model Manual"}
                            </button>
                          </div>
                          {isCustomProfileModel ? (
                            <div>
                              <input
                                type="text"
                                required
                                value={editingProfile.model || ""}
                                onChange={(e) =>
                                  setEditingProfile({ ...editingProfile, model: e.target.value.trim() })
                                }
                                placeholder="Cth: anthropic/claude-3.7-sonnet atau deepseek/deepseek-r1"
                                className="input text-xs font-mono"
                              />
                              <p className="text-[10px] text-gray-400 mt-1">
                                Masukkan ID model kustom yang didukung oleh provider akun AI ini.
                              </p>
                            </div>
                          ) : (
                            <select
                              className="input text-xs"
                              value={
                                isKnownModel(editingProfile.provider, editingProfile.model)
                                  ? editingProfile.model
                                  : "__custom__"
                              }
                              onChange={(e) => {
                                if (e.target.value === "__custom__") {
                                  setIsCustomProfileModel(true);
                                } else {
                                  setEditingProfile({ ...editingProfile, model: e.target.value });
                                }
                              }}
                            >
                              {(PROVIDER_MODELS[editingProfile.provider] || []).map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.name}
                                </option>
                              ))}
                              <option value="__custom__">➕ Ketik ID Model Manual (Custom)...</option>
                            </select>
                          )}
                          <p className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1">
                            <span>✓ Kunci API tersimpan di Akun AI</span>
                            <span className="font-mono text-purple-300">({connections.find((c) => c.id === editingProfile.connectionId)?.apiKeyMasked})</span>
                            <span>— tidak ada duplikasi data di profil.</span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── Jadwal & Jam Operasional Bot (Schedule Mode) ──────────────── */}
                  <div className="card p-4 space-y-4 bg-gray-900/50 border-gray-800">
                    <div className="flex items-center justify-between pb-1 border-b border-gray-800/80">
                      <div>
                        <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <Clock className="w-4 h-4 text-purple-400" />
                          <span>Jadwal Operasional Bot (Schedule Mode)</span>
                        </span>
                        <span className="text-[11px] text-gray-400">
                          Tentukan kapan asisten AI aktif menjawab pesan masuk pelanggan.
                        </span>
                      </div>
                    </div>

                    {/* Mode Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() =>
                          setEditingProfile({ ...editingProfile, scheduleMode: "always" })
                        }
                        className={`p-3 rounded-xl border text-left transition-all ${
                          editingProfile.scheduleMode === "always" || !editingProfile.scheduleMode
                            ? "bg-purple-950/40 border-purple-500/80 shadow-lg shadow-purple-950/30"
                            : "bg-gray-900/60 border-gray-800 hover:border-gray-700"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Zap className={`w-4 h-4 ${editingProfile.scheduleMode === "always" || !editingProfile.scheduleMode ? "text-purple-400" : "text-gray-400"}`} />
                          <span className="text-xs font-semibold text-white">Selalu Aktif (24/7)</span>
                        </div>
                        <p className="text-[10px] text-gray-400 leading-snug">
                          Bot merespons pesan kapan saja setiap saat tanpa batasan waktu.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setEditingProfile({ ...editingProfile, scheduleMode: "after_hours" })
                        }
                        className={`p-3 rounded-xl border text-left transition-all ${
                          editingProfile.scheduleMode === "after_hours"
                            ? "bg-purple-950/40 border-purple-500/80 shadow-lg shadow-purple-950/30"
                            : "bg-gray-900/60 border-gray-800 hover:border-gray-700"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Moon className={`w-4 h-4 ${editingProfile.scheduleMode === "after_hours" ? "text-indigo-400" : "text-gray-400"}`} />
                          <span className="text-xs font-semibold text-white">Di Luar Jam Kerja</span>
                        </div>
                        <p className="text-[10px] text-gray-400 leading-snug">
                          HANYA aktif saat toko tutup / malam hari / hari libur.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setEditingProfile({ ...editingProfile, scheduleMode: "work_hours" })
                        }
                        className={`p-3 rounded-xl border text-left transition-all ${
                          editingProfile.scheduleMode === "work_hours"
                            ? "bg-purple-950/40 border-purple-500/80 shadow-lg shadow-purple-950/30"
                            : "bg-gray-900/60 border-gray-800 hover:border-gray-700"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Briefcase className={`w-4 h-4 ${editingProfile.scheduleMode === "work_hours" ? "text-emerald-400" : "text-gray-400"}`} />
                          <span className="text-xs font-semibold text-white">Hanya Jam Kerja</span>
                        </div>
                        <p className="text-[10px] text-gray-400 leading-snug">
                          HANYA aktif selama jam kerja operasional kantor/toko.
                        </p>
                      </button>
                    </div>

                    {/* Operational Hours & Days (if not always) */}
                    {editingProfile.scheduleMode !== "always" && editingProfile.scheduleMode && (
                      <div className="p-3.5 rounded-xl bg-gray-950/60 border border-gray-800 space-y-3.5 animate-in fade-in duration-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="label text-[11px] mb-1 flex items-center gap-1.5">
                              <Sun className="w-3.5 h-3.5 text-amber-400" />
                              <span>Jam Mulai Kerja (Buka)</span>
                            </label>
                            <input
                              type="time"
                              value={editingProfile.workHoursStart || "08:00"}
                              onChange={(e) =>
                                setEditingProfile({
                                  ...editingProfile,
                                  workHoursStart: e.target.value,
                                })
                              }
                              className="input text-xs"
                            />
                          </div>

                          <div>
                            <label className="label text-[11px] mb-1 flex items-center gap-1.5">
                              <Moon className="w-3.5 h-3.5 text-indigo-400" />
                              <span>Jam Selesai Kerja (Tutup)</span>
                            </label>
                            <input
                              type="time"
                              value={editingProfile.workHoursEnd || "17:00"}
                              onChange={(e) =>
                                setEditingProfile({
                                  ...editingProfile,
                                  workHoursEnd: e.target.value,
                                })
                              }
                              className="input text-xs"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="label text-[11px] mb-1.5 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-purple-400" />
                            <span>Hari Kerja Operasional</span>
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              { id: 1, label: "Senin" },
                              { id: 2, label: "Selasa" },
                              { id: 3, label: "Rabu" },
                              { id: 4, label: "Kamis" },
                              { id: 5, label: "Jumat" },
                              { id: 6, label: "Sabtu" },
                              { id: 7, label: "Minggu" },
                            ].map((day) => {
                              const activeDays = editingProfile.workDays || [1, 2, 3, 4, 5];
                              const isActive = activeDays.includes(day.id);
                              return (
                                <button
                                  type="button"
                                  key={day.id}
                                  onClick={() => {
                                    const next = isActive
                                      ? activeDays.filter((d) => d !== day.id)
                                      : [...activeDays, day.id].sort((a, b) => a - b);
                                    setEditingProfile({ ...editingProfile, workDays: next });
                                  }}
                                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                                    isActive
                                      ? "bg-purple-600 text-white shadow-md shadow-purple-900/30"
                                      : "bg-gray-800 text-gray-400 hover:text-gray-200 border border-gray-700"
                                  }`}
                                >
                                  {day.label}
                                </button>
                              );
                            })}
                          </div>
                          <p className="text-[10px] text-gray-500 mt-1">
                            Pilih hari-hari ketika jam operasional di atas berlaku (Waktu Indonesia Barat / Asia:Jakarta).
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── Parameter Generasi AI (Advanced Tuning) ───────────────────── */}
                  <div className="card p-4 space-y-4 bg-gray-900/50 border-gray-800">
                    <div className="flex items-center justify-between pb-1 border-b border-gray-800/80">
                      <div>
                        <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <Sliders className="w-4 h-4 text-purple-400" />
                          <span>Parameter Generasi AI (Tuning Lanjutan)</span>
                        </span>
                        <span className="text-[11px] text-gray-400">
                          Atur tingkat kreativitas, batas panjang respon, dan memori riwayat pesan bot.
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Temperature Slider */}
                      <div className="p-3 rounded-xl bg-gray-950/60 border border-gray-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="label text-[11px] mb-0 font-medium text-gray-200">
                            Kreativitas (Temperature)
                          </label>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                            (editingProfile.temperature ?? 0.7) <= 0.3
                              ? "bg-cyan-950/80 text-cyan-300 border border-cyan-800/60"
                              : (editingProfile.temperature ?? 0.7) <= 0.7
                              ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800/60"
                              : "bg-purple-950/80 text-purple-300 border border-purple-800/60"
                          }`}>
                            {editingProfile.temperature ?? 0.7}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={editingProfile.temperature ?? 0.7}
                          onChange={(e) =>
                            setEditingProfile({
                              ...editingProfile,
                              temperature: parseFloat(e.target.value),
                            })
                          }
                          className="w-full accent-purple-500 cursor-pointer"
                        />
                        <p className="text-[10px] text-gray-400 leading-snug">
                          {(editingProfile.temperature ?? 0.7) <= 0.3
                            ? "Presisi & Faktual: Cocok untuk data resmi, SOP kaku, dan katalog harga."
                            : (editingProfile.temperature ?? 0.7) <= 0.7
                            ? "Seimbang (Rekomendasi): Percakapan luwes, ramah, dan tetap akurat."
                            : "Sangat Kreatif: Jawaban lebih ekspresif, variatif, dan dinamis."}
                        </p>
                      </div>

                      {/* Max Tokens */}
                      <div className="p-3 rounded-xl bg-gray-950/60 border border-gray-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="label text-[11px] mb-0 font-medium text-gray-200">
                            Batas Panjang (Max Tokens)
                          </label>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/60 font-mono font-bold">
                            {editingProfile.maxTokens ?? 500}
                          </span>
                        </div>
                        <input
                          type="number"
                          min="100"
                          max="2000"
                          step="50"
                          value={editingProfile.maxTokens ?? 500}
                          onChange={(e) =>
                            setEditingProfile({
                              ...editingProfile,
                              maxTokens: parseInt(e.target.value) || 500,
                            })
                          }
                          className="input text-xs font-mono py-1 px-2.5"
                        />
                        <div className="flex items-center gap-1.5 pt-1">
                          {[250, 500, 1000].map((t) => (
                            <button
                              type="button"
                              key={t}
                              onClick={() => setEditingProfile({ ...editingProfile, maxTokens: t })}
                              className={`text-[10px] px-2 py-0.5 rounded transition-colors ${
                                (editingProfile.maxTokens ?? 500) === t
                                  ? "bg-purple-600 text-white"
                                  : "bg-gray-800 text-gray-400 hover:text-white"
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                        <p className="text-[10px] text-gray-400 leading-snug">
                          500 token setara ~350-400 kata. Membatasi token membantu menghemat biaya API.
                        </p>
                      </div>

                      {/* Context Window */}
                      <div className="p-3 rounded-xl bg-gray-950/60 border border-gray-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="label text-[11px] mb-0 font-medium text-gray-200">
                            Memori Chat (Context Window)
                          </label>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/60 font-mono font-bold">
                            {editingProfile.contextWindow ?? 8} Pesan
                          </span>
                        </div>
                        <input
                          type="number"
                          min="2"
                          max="20"
                          step="1"
                          value={editingProfile.contextWindow ?? 8}
                          onChange={(e) =>
                            setEditingProfile({
                              ...editingProfile,
                              contextWindow: parseInt(e.target.value) || 8,
                            })
                          }
                          className="input text-xs font-mono py-1 px-2.5"
                        />
                        <div className="flex items-center gap-1.5 pt-1">
                          {[4, 8, 16].map((w) => (
                            <button
                              type="button"
                              key={w}
                              onClick={() => setEditingProfile({ ...editingProfile, contextWindow: w })}
                              className={`text-[10px] px-2 py-0.5 rounded transition-colors ${
                                (editingProfile.contextWindow ?? 8) === w
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-800 text-gray-400 hover:text-white"
                              }`}
                            >
                              {w} Pesan
                            </button>
                          ))}
                        </div>
                        <p className="text-[10px] text-gray-400 leading-snug">
                          Jumlah pesan riwayat sebelumnya yang disertakan agar bot memahami alur obrolan.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ── Filter Kontak Pengirim (Target Pelanggan) ──────────────────── */}
                  <div className="card p-4 space-y-4 bg-gray-900/50 border-gray-800">
                    <div className="flex items-center justify-between pb-1 border-b border-gray-800/80">
                      <div>
                        <span className="text-xs font-bold text-white uppercase tracking-wider block">
                          Filter Kontak Pengirim (Target Pelanggan)
                        </span>
                        <span className="text-[11px] text-gray-400">
                          Tentukan kontak mana saja yang akan dibalas otomatis oleh AI pada profil ini.
                        </span>
                      </div>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700">
                        {editingProfile.senderFilterMode === "whitelist"
                          ? `${(editingProfile.whitelistNumbers || []).length} Nomor Whitelist`
                          : editingProfile.senderFilterMode === "blacklist"
                          ? `${(editingProfile.blacklistNumbers || []).length} Nomor Blacklist`
                          : "Semua Kontak"}
                      </span>
                    </div>

                    {/* Mode Selector Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() =>
                          setEditingProfile({ ...editingProfile, senderFilterMode: "all" })
                        }
                        className={`p-3 rounded-xl border text-left transition-all ${
                          !editingProfile.senderFilterMode || editingProfile.senderFilterMode === "all"
                            ? "bg-purple-950/40 border-purple-500/80 text-white shadow-lg shadow-purple-950/40"
                            : "bg-gray-950/40 border-gray-800/80 text-gray-400 hover:border-gray-700 hover:text-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="w-4 h-4 text-purple-400" />
                          <span className="text-xs font-bold text-white">Semua Nomor</span>
                        </div>
                        <p className="text-[11px] text-gray-400 leading-tight">
                          AI membalas semua pesan yang masuk ke sesi ini.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setEditingProfile({ ...editingProfile, senderFilterMode: "whitelist" })
                        }
                        className={`p-3 rounded-xl border text-left transition-all ${
                          editingProfile.senderFilterMode === "whitelist"
                            ? "bg-emerald-950/40 border-emerald-500/80 text-white shadow-lg shadow-emerald-950/40"
                            : "bg-gray-950/40 border-gray-800/80 text-gray-400 hover:border-gray-700 hover:text-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <UserCheck className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-bold text-white">Nomor Tertentu</span>
                        </div>
                        <p className="text-[11px] text-gray-400 leading-tight">
                          HANYA balas nomor yang didaftarkan (Whitelist).
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setEditingProfile({ ...editingProfile, senderFilterMode: "blacklist" })
                        }
                        className={`p-3 rounded-xl border text-left transition-all ${
                          editingProfile.senderFilterMode === "blacklist"
                            ? "bg-red-950/40 border-red-500/80 text-white shadow-lg shadow-red-950/40"
                            : "bg-gray-950/40 border-gray-800/80 text-gray-400 hover:border-gray-700 hover:text-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <UserX className="w-4 h-4 text-red-400" />
                          <span className="text-xs font-bold text-white">Kecualikan Nomor</span>
                        </div>
                        <p className="text-[11px] text-gray-400 leading-tight">
                          Balas semua KECUALI nomor yang didaftarkan (Blacklist).
                        </p>
                      </button>
                    </div>

                    {/* Whitelist / Blacklist Dynamic Number Tag Manager */}
                    {(editingProfile.senderFilterMode === "whitelist" ||
                      editingProfile.senderFilterMode === "blacklist") && (
                      <div className="p-3.5 rounded-xl bg-gray-950/60 border border-gray-800/90 space-y-3 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between">
                          <label className="label text-[11px] font-semibold text-gray-300">
                            {editingProfile.senderFilterMode === "whitelist"
                              ? "Daftar Nomor yang HANYA Dibalas oleh AI (Whitelist)"
                              : "Daftar Nomor yang DIBLOKIR / DIABAIKAN oleh AI (Blacklist)"}
                          </label>
                          {((editingProfile.senderFilterMode === "whitelist"
                            ? editingProfile.whitelistNumbers
                            : editingProfile.blacklistNumbers) || []).length > 0 && (
                            <button
                              type="button"
                              onClick={handleClearAllPhoneNumbers}
                              className="text-[10px] text-red-400 hover:text-red-300 transition-colors"
                            >
                              Hapus Semua
                            </button>
                          )}
                        </div>

                        {/* Input Add Number */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={phoneInput}
                            onChange={(e) => setPhoneInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddPhoneNumber();
                              }
                            }}
                            placeholder="Ketik nomor HP (contoh: 628123456789 atau 08123456789), pisahkan koma jika banyak..."
                            className="input text-xs font-mono flex-1"
                          />
                          <button
                            type="button"
                            onClick={handleAddPhoneNumber}
                            className="btn-primary text-xs px-3.5 py-1.5 shrink-0"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Tambah</span>
                          </button>
                        </div>

                        {/* Numbers Chips Container */}
                        {((editingProfile.senderFilterMode === "whitelist"
                          ? editingProfile.whitelistNumbers
                          : editingProfile.blacklistNumbers) || []).length === 0 ? (
                          <div className="p-3 rounded-lg border border-dashed border-gray-800 text-center text-xs text-gray-500 italic">
                            Belum ada nomor yang didaftarkan. Masukkan nomor WhatsApp di atas lalu klik Tambah.
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
                            {((editingProfile.senderFilterMode === "whitelist"
                              ? editingProfile.whitelistNumbers
                              : editingProfile.blacklistNumbers) || []).map((num) => (
                              <span
                                key={num}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border ${
                                  editingProfile.senderFilterMode === "whitelist"
                                    ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300"
                                    : "bg-red-950/40 border-red-800/60 text-red-300"
                                }`}
                              >
                                <span>{formatPhoneNumberDisplay(num)}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePhoneNumber(num)}
                                  className="p-0.5 hover:bg-black/30 rounded text-gray-400 hover:text-white transition-colors"
                                  title="Hapus nomor ini"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Ignore Groups Checkbox */}
                    <label className="flex items-start gap-3 p-3 rounded-xl bg-gray-950/40 border border-gray-800/80 cursor-pointer hover:border-gray-700 transition-colors">
                      <input
                        type="checkbox"
                        checked={editingProfile.ignoreGroups !== false}
                        onChange={(e) =>
                          setEditingProfile({ ...editingProfile, ignoreGroups: e.target.checked })
                        }
                        className="mt-0.5 rounded bg-gray-900 border-gray-700 text-purple-600 focus:ring-0"
                      />
                      <div>
                        <span className="text-xs font-bold text-white block">
                          Abaikan Chat Grup (Hanya Balas Pesan Pribadi / DM)
                        </span>
                        <span className="text-[11px] text-gray-400 block mt-0.5">
                          Sangat direkomendasikan agar AI asisten tidak merespons obrolan di dalam grup WhatsApp dan hanya menjawab chat langsung dari pelanggan.
                        </span>
                      </div>
                    </label>
                  </div>

                  {/* System Prompt & Persona */}
                  <div className="card p-4 space-y-3 bg-gray-900/50 border-gray-800">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-gray-800/80">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Instruksi & Kepribadian Bot
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] text-gray-500">Template:</span>
                        {KB_TEMPLATES.map((tmpl, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setEditingProfile({
                                ...editingProfile,
                                systemPrompt: tmpl.prompt,
                                knowledgeBase: tmpl.kb,
                              });
                            }}
                            className="px-2 py-0.5 rounded text-[10px] bg-gray-800 hover:bg-purple-950/60 border border-gray-700 hover:border-purple-600/50 text-gray-300 transition-colors"
                          >
                            {tmpl.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <textarea
                      rows={4}
                      value={editingProfile.systemPrompt}
                      onChange={(e) =>
                        setEditingProfile({ ...editingProfile, systemPrompt: e.target.value })
                      }
                      placeholder="Jelaskan peran bot, gaya bahasa, batasan jawaban, dll..."
                      className="input text-xs leading-relaxed resize-none"
                    />
                  </div>

                  {/* Knowledge Base FAQ */}
                  <div className="card p-4 space-y-3 bg-gray-900/50 border-gray-800">
                    <div className="flex items-center justify-between pb-1 border-b border-gray-800/80">
                      <div>
                        <span className="text-xs font-bold text-white uppercase tracking-wider block">
                          Knowledge Base & FAQ Dokumen
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {editingProfile.knowledgeBase?.length || 0} karakter
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          ref={kbFileInputRef}
                          onChange={handleKbFileUpload}
                          accept=".txt,.md,.json,.csv,.pdf"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => kbFileInputRef.current?.click()}
                          disabled={uploadingDoc}
                          className="btn-secondary text-[11px] py-1 px-2.5 flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5 text-purple-400" />
                          <span>{uploadingDoc ? "Membaca..." : "Upload Berkas (.txt/.pdf)"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowUrlModal(true)}
                          disabled={scrapingUrl}
                          className="btn-secondary text-[11px] py-1 px-2.5 flex items-center gap-1.5"
                        >
                          <Globe className="w-3.5 h-3.5 text-blue-400" />
                          <span>{scrapingUrl ? "Mengambil..." : "🌐 Import dari URL Web"}</span>
                        </button>
                      </div>
                    </div>

                    <textarea
                      rows={5}
                      value={editingProfile.knowledgeBase || ""}
                      onChange={(e) =>
                        setEditingProfile({ ...editingProfile, knowledgeBase: e.target.value })
                      }
                      placeholder="Tuliskan daftar harga, FAQ, katalog produk, atau ketentuan garansi di sini..."
                      className="input text-xs leading-relaxed font-mono resize-none"
                    />
                  </div>

                  {/* Handover CS Manusia */}
                  <div className="card p-4 space-y-3 bg-gray-900/50 border-gray-800">
                    <span className="text-xs font-bold text-white uppercase tracking-wider block pb-1 border-b border-gray-800/80">
                      Pengalihan ke Customer Service (Handover)
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="label">Kata Kunci Alih CS</label>
                        <input
                          type="text"
                          value={
                            Array.isArray(editingProfile.handoverKeywords)
                              ? editingProfile.handoverKeywords.join(", ")
                              : editingProfile.handoverKeywords || ""
                          }
                          onChange={(e) =>
                            setEditingProfile({
                              ...editingProfile,
                              handoverKeywords: e.target.value
                                .split(",")
                                .map((k) => k.trim())
                                .filter(Boolean),
                            })
                          }
                          placeholder="cs, admin, human, bantuan"
                          className="input text-xs"
                        />
                        <p className="text-[10px] text-gray-500 mt-1">Pisahkan dengan koma</p>
                      </div>

                      <div>
                        <label className="label">Durasi Jeda AI Setelah Alih CS</label>
                        <select
                          className="input text-xs"
                          value={editingProfile.handoverDurationMinutes || 120}
                          onChange={(e) =>
                            setEditingProfile({
                              ...editingProfile,
                              handoverDurationMinutes: Number(e.target.value),
                            })
                          }
                        >
                          <option value={15}>15 Menit</option>
                          <option value={30}>30 Menit</option>
                          <option value={60}>1 Jam</option>
                          <option value={120}>2 Jam (Rekomendasi)</option>
                          <option value={240}>4 Jam</option>
                          <option value={720}>12 Jam</option>
                          <option value={1440}>24 Jam (1 Hari)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="label">Pesan Notifikasi Handover</label>
                      <input
                        type="text"
                        value={editingProfile.handoverMessage || ""}
                        onChange={(e) =>
                          setEditingProfile({ ...editingProfile, handoverMessage: e.target.value })
                        }
                        placeholder="Baik kak, pesan Anda dialihkan ke CS manusia..."
                        className="input text-xs"
                      />
                    </div>
                  </div>

                  {/* Submit Actions */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn-primary flex-1 justify-center py-2.5 text-xs font-semibold shadow-lg shadow-brand-500/20"
                    >
                      {saving ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      <span>{saving ? "Menyimpan..." : "Simpan Pengaturan Profil AI"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={closeEditor}
                      className="btn-secondary py-2.5 px-4 text-xs"
                    >
                      Tutup
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Column: WhatsApp Bot Simulator (5 cols) */}
              <div className="lg:col-span-5 flex flex-col h-full card bg-gray-900/50 border-gray-800 overflow-hidden">
                <div className="p-3.5 border-b border-gray-800 bg-gray-950/70 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white leading-none">
                        Simulator Bot ({editingProfile.name})
                      </h4>
                      <p className="text-[10px] text-emerald-400 mt-0.5">
                        ● Online · {editingProfile.provider} ({editingProfile.model})
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setSimulatorChat([
                        {
                          role: "bot",
                          text: `Halo kak! Saya adalah asisten untuk profil "${editingProfile.name}". Silakan uji respons saya di sini.`,
                          time: "10:00",
                        },
                      ])
                    }
                    className="text-[11px] text-gray-400 hover:text-white flex items-center gap-1 p-1"
                    title="Reset Obrolan"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>

                {/* Quick Test Chips */}
                <div className="px-3 py-2 border-b border-gray-800/80 bg-gray-950/40 flex items-center gap-1.5 overflow-x-auto text-[10px]">
                  <span className="text-gray-500 shrink-0">Tes Cepat:</span>
                  {["Berapa harga paket?", "Jam berapa buka?", "Saya mau komplain", "Halo!"].map(
                    (chip, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => void handleSendSimulator(undefined, chip)}
                        className="px-2 py-0.5 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 shrink-0 transition-colors"
                      >
                        {chip}
                      </button>
                    ),
                  )}
                </div>

                {/* Message Bubble Feed */}
                <div
                  className="flex-1 p-4 overflow-y-auto space-y-3 min-h-[300px] max-h-[500px]"
                  style={{
                    backgroundImage: `radial-gradient(circle at center, rgba(31, 41, 55, 0.4) 1px, transparent 1px)`,
                    backgroundSize: "20px 20px",
                  }}
                >
                  {simulatorChat.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
                          msg.role === "user"
                            ? "bg-purple-600 text-white rounded-tr-none"
                            : "bg-gray-800 text-gray-100 border border-gray-700/70 rounded-tl-none"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                        <span
                          className={`text-[9px] block text-right mt-1 opacity-70 ${
                            msg.role === "user" ? "text-purple-200" : "text-gray-400"
                          }`}
                        >
                          {msg.time}
                        </span>
                      </div>
                    </div>
                  ))}
                  {testingAi && (
                    <div className="flex items-start">
                      <div className="bg-gray-800 rounded-2xl rounded-tl-none px-3.5 py-2.5 border border-gray-700/70 text-xs text-gray-400 flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
                        <span>AI sedang memproses jawaban...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Input box */}
                <form
                  onSubmit={(e) => void handleSendSimulator(e)}
                  className="p-3 border-t border-gray-800 bg-gray-950/80 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    placeholder="Ketik pesan untuk mengetes bot..."
                    className="input text-xs flex-1 bg-gray-900 border-gray-800"
                  />
                  <button
                    type="submit"
                    disabled={testingAi || !testInput.trim()}
                    className="btn-primary p-2 text-xs shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ── Import dari URL Website Modal ────────────────────────────────────── */}
      {showUrlModal && (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Import Knowledge Base dari URL Web</h3>
                  <p className="text-[10px] text-gray-400">Ambil teks otomatis dari situs/FAQ untuk dipelajari bot</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowUrlModal(false);
                  setUrlInput("");
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleScrapeWebUrl} className="space-y-3">
              <div>
                <label className="label">Alamat URL Halaman Web</label>
                <input
                  type="url"
                  required
                  placeholder="https://tokoanda.com/faq atau https://domain.com/tentang-kami"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="input text-xs font-mono"
                  autoFocus
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Konten teks bersih (bebas HTML script/style) hingga 40.000 karakter akan otomatis ditambahkan ke Knowledge Base.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowUrlModal(false);
                    setUrlInput("");
                  }}
                  className="btn-secondary text-xs"
                  disabled={scrapingUrl}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={scrapingUrl || !urlInput.trim()}
                  className="btn-primary text-xs flex items-center gap-1.5"
                >
                  {scrapingUrl ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Mengunduh Teks Web...</span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-3.5 h-3.5" />
                      <span>Ambil & Pelajari Konten</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Global Floating Toast Notification ─────────────────────────────────── */}
      {toast && (
        <div className="fixed top-5 right-5 z-[9999] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md animate-in slide-in-from-top-3 fade-in duration-200 max-w-md bg-gray-900/95 border-gray-750">
          {toast.type === "error" && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
          {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
          {toast.type === "info" && <Info className="w-5 h-5 text-sky-400 shrink-0" />}
          <div className="text-xs text-gray-200 font-medium flex-1 leading-snug">
            {toast.message}
          </div>
          <button
            onClick={() => setToast(null)}
            className="p-1 text-gray-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
