import { useState, useEffect, useRef, useMemo } from "react";
import {
  aiBotApi,
  AiBotProfile,
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

interface Props {
  sessions: Session[];
}

export default function AiBotProfilesView({ sessions }: Props) {
  const { t } = useI18n();
  const [profiles, setProfiles] = useState<AiBotProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Editor modal/view state
  const [editingProfile, setEditingProfile] = useState<AiBotProfile | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const kbFileInputRef = useRef<HTMLInputElement>(null);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const res = await aiBotApi.listProfiles();
      if (res.data) setProfiles(res.data);
    } catch (e) {
      console.error("Failed to load AI profiles", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProfiles();
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
    return { total, active, assignedSessionsCount };
  }, [profiles]);

  // Filtered profiles
  const filteredProfiles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        p.model.toLowerCase().includes(q) ||
        p.provider.toLowerCase().includes(q),
    );
  }, [profiles, search]);

  const openNewProfile = () => {
    const newProf: AiBotProfile = {
      id: "",
      name: `Profil AI #${profiles.length + 1}`,
      description: "Asisten otomatis untuk sesi tertentu",
      isEnabled: true,
      provider: "gemini",
      apiKey: "",
      apiKeyMasked: "",
      hasKey: false,
      model: "gemini-3.6-flash",
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
    setKeyInput("");
    setShowKey(false);
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
    setEditingProfile({ ...p });
    setIsCreatingNew(false);
    setKeyInput("");
    setShowKey(false);
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
    setKeyInput("");
    setSaveSuccessMsg("");
  };

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
        await loadProfiles();
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
        await loadProfiles();
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
        setKeyInput("");
        await loadProfiles();
        setTimeout(() => setSaveSuccessMsg(""), 3500);
        if (isCreatingNew) {
          setIsCreatingNew(false);
          setEditingProfile(saved);
        }
      }
    } catch (err: any) {
      console.error("Save profile error", err);
      alert(`Gagal menyimpan profil AI: ${err?.message || "Kesalahan server"}`);
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
      if (editingProfile && editingProfile.id) {
        const res = await aiBotApi.testProfile(editingProfile.id, msgToSend.trim());
        const replyText =
          res.data?.reply ||
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
      } else {
        // Fallback test
        const res = await aiBotApi.testPrompt(msgToSend.trim());
        setSimulatorChat((prev) => [
          ...prev,
          {
            role: "bot",
            text: res.data?.reply || "AI merespons.",
            time: new Date().toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);
      }
    } catch (err: any) {
      setSimulatorChat((prev) => [
        ...prev,
        {
          role: "bot",
          text: `⚠️ Gagal menghasilkan jawaban: ${err?.message || "Periksa API Key dan Model AI"}`,
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
        }
      } catch (err: any) {
        alert(`Gagal memproses dokumen: ${err?.message || "Format berkas tidak didukung"}`);
      } finally {
        setUploadingDoc(false);
      }
    };
    reader.onerror = () => setUploadingDoc(false);
    reader.readAsDataURL(file);
    if (kbFileInputRef.current) kbFileInputRef.current.value = "";
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
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Multi-Persona</p>
            <p className="text-xs text-emerald-400 font-semibold mt-0.5">Tersedia</p>
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
            placeholder="Cari profil AI berdasarkan nama, model, atau provider..."
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

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => void loadProfiles()}
            disabled={loading}
            className="btn-secondary text-xs"
            title="Refresh Profil"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
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
              Buat profil AI pertama Anda untuk mengatur aturan prompt, knowledge base FAQ, dan model AI untuk nomor WhatsApp Anda.
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

                  {/* Pills Model & Sessions */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-950 border border-gray-800 text-gray-300 font-mono">
                      {p.provider.toUpperCase()} · {p.model}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        hasAssignedSessions
                          ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/60"
                          : "bg-gray-800/60 text-gray-400 border-gray-700/60"
                      }`}
                    >
                      🔗 {p.sessionCount || (p.targetSessionIds || []).length} Sesi Terhubung
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-950 border border-gray-800 text-gray-400">
                      Jeda CS: {p.handoverDurationMinutes || 120}m
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

      {/* Profile Studio / Full Editor Modal */}
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
                    Atur instruksi, knowledge base FAQ, dan tautkan ke sesi WhatsApp pilihan.
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

                  {/* AI Provider & Model */}
                  <div className="card p-4 space-y-3 bg-gray-900/50 border-gray-800">
                    <span className="text-xs font-bold text-white uppercase tracking-wider block pb-1 border-b border-gray-800/80">
                      Provider & Model AI
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="label">AI Provider</label>
                        <select
                          className="input text-xs"
                          value={editingProfile.provider}
                          onChange={(e) => {
                            const newProv = e.target.value as any;
                            const defaultMod =
                              PROVIDER_MODELS[newProv]?.[0]?.id || "gemini-3.6-flash";
                            setEditingProfile({
                              ...editingProfile,
                              provider: newProv,
                              model: defaultMod,
                            });
                          }}
                        >
                          <option value="gemini">Google Gemini (Gratis & Cepat)</option>
                          <option value="grok">xAI Grok (Cerdas & Reasoning)</option>
                          <option value="deepseek">DeepSeek AI (Super Hemat & Cerdas)</option>
                          <option value="openai">OpenAI (ChatGPT GPT-4o)</option>
                          <option value="openrouter">OpenRouter (Multi-Model Hub)</option>
                        </select>
                      </div>

                      <div>
                        <label className="label">Model AI</label>
                        <select
                          className="input text-xs"
                          value={editingProfile.model}
                          onChange={(e) =>
                            setEditingProfile({ ...editingProfile, model: e.target.value })
                          }
                        >
                          {(PROVIDER_MODELS[editingProfile.provider] || []).map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* API Key */}
                    <div>
                      <label className="label flex items-center justify-between">
                        <span>API Key {editingProfile.provider.toUpperCase()}</span>
                        {editingProfile.hasKey && (
                          <span className="text-[11px] text-emerald-400">
                            ✓ Key tersimpan ({editingProfile.apiKeyMasked})
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <input
                          type={showKey ? "text" : "password"}
                          value={keyInput}
                          onChange={(e) => setKeyInput(e.target.value)}
                          placeholder={
                            editingProfile.hasKey
                              ? "Biarkan kosong jika tidak ingin mengubah key"
                              : "Masukkan API Key Anda..."
                          }
                          className="input text-xs pr-10 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowKey(!showKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
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
                          className="btn-secondary text-[11px] py-1 px-2.5"
                        >
                          <Upload className="w-3.5 h-3.5 text-purple-400" />
                          <span>{uploadingDoc ? "Membaca..." : "Upload Berkas (.txt/.pdf)"}</span>
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

                {/* Chat Message Bubbles */}
                <div className="flex-1 p-3.5 space-y-3 overflow-y-auto max-h-[380px] sm:max-h-[460px] bg-gray-950/30">
                  {simulatorChat.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-md ${
                          msg.role === "user"
                            ? "bg-emerald-600 text-white rounded-br-none"
                            : "bg-gray-800 text-gray-200 border border-gray-700/80 rounded-bl-none"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                        <span
                          className={`text-[9px] block text-right mt-1 ${
                            msg.role === "user" ? "text-emerald-200" : "text-gray-400"
                          }`}
                        >
                          {msg.time}
                        </span>
                      </div>
                    </div>
                  ))}
                  {testingAi && (
                    <div className="flex items-center gap-2 text-xs text-gray-400 p-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>AI sedang mengetik balasan...</span>
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Chat Input Bar */}
                <form
                  onSubmit={(e) => void handleSendSimulator(e)}
                  className="p-3 border-t border-gray-800 bg-gray-950 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    placeholder="Ketik pesan untuk mengetes bot..."
                    className="input text-xs py-2 flex-1 bg-gray-900 border-gray-750 focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={testingAi || !testInput.trim()}
                    className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
