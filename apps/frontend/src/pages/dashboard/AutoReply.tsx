import { useState, useEffect, useRef } from "react";
import { AutoReplyRule, aiBotApi, AiBotConfig } from "../../api/client";
import EmptyState from "../../components/EmptyState";
import {
  Bot,
  Plus,
  RefreshCw,
  Sparkles,
  Key,
  Send,
  CheckCircle2,
  Upload,
  Smartphone,
  Clock,
  RotateCcw,
  Users,
  Loader2,
} from "lucide-react";
import {
  useAutoReply,
  RuleForm,
} from "../../features/auto-reply/hooks/useAutoReply";
import AutoReplyForm from "../../features/auto-reply/components/AutoReplyForm";
import AutoReplyTable from "../../features/auto-reply/components/AutoReplyTable";
import { useI18n } from "../../context/I18nContext";

const PROVIDER_MODELS: Record<string, Array<{ id: string; name: string; desc: string }>> = {
  gemini: [
    { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash (Aktif - Cepat)", desc: "Generasi 2.0 GA tercepat & multimodal dari Google" },
    { id: "gemini-2.0-flash-lite", name: "Gemini 2.0 Flash Lite (Aktif - Super Cepat)", desc: "Ultra ringan, latensi paling rendah & efisien" },
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

export default function AutoReply() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<"rules" | "ai">("rules");

  // Rules state
  const {
    rules,
    sessions,
    loading,
    load,
    create,
    update,
    toggleActive,
    remove,
    sessionName,
  } = useAutoReply();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AutoReplyRule | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // AI Bot state
  const [aiConfig, setAiConfig] = useState<AiBotConfig>({
    isEnabled: false,
    provider: "gemini",
    apiKeyMasked: "",
    hasKey: false,
    model: "gemini-2.0-flash",
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
    senderFilterMode: "all",
    whitelistNumbers: [],
    blacklistNumbers: [],
    ignoreGroups: true,
  });

  const [aiKeyInput, setAiKeyInput] = useState("");
  const [savingAi, setSavingAi] = useState(false);
  const [aiSaveMsg, setAiSaveMsg] = useState("");
  const [testInput, setTestInput] = useState("");
  const [testingAi, setTestingAi] = useState(false);
  const [simulatorChat, setSimulatorChat] = useState<
    Array<{ role: "user" | "bot"; text: string; time: string }>
  >([
    {
      role: "bot",
      text: "Halo kak! Saya adalah asisten WhatsApp otomatis Anda. Silakan tanyakan apa saja untuk menguji balasan saya berdasarkan Prompt & Knowledge Base yang Anda atur.",
      time: "10:00",
    },
  ]);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const kbFileInputRef = useRef<HTMLInputElement>(null);

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

  const [uploadingDoc, setUploadingDoc] = useState(false);

  const handleKbFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDoc(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string) || "";
        const res = await aiBotApi.parseDocument(base64, file.name);
        const extractedText = res.data?.text;
        if (extractedText) {
          setAiConfig((prev) => ({
            ...prev,
            knowledgeBase: prev.knowledgeBase
              ? `${prev.knowledgeBase}\n\n[DOKUMEN: ${file.name}]\n${extractedText}`
              : `[DOKUMEN: ${file.name}]\n${extractedText}`,
          }));
        }
      } catch (err) {
        console.error("Failed to parse document", err);
      } finally {
        setUploadingDoc(false);
      }
    };
    reader.onerror = () => setUploadingDoc(false);
    reader.readAsDataURL(file);
    if (kbFileInputRef.current) kbFileInputRef.current.value = "";
  };

  const loadAiConfig = async () => {
    try {
      const res = await aiBotApi.getConfig();
      if (res.data) setAiConfig(res.data);
    } catch (e) {
      console.error("Failed to load AI bot config", e);
    }
  };

  useEffect(() => {
    if (activeTab === "ai") {
      void loadAiConfig();
    }
  }, [activeTab]);

  const handleSaveAiConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAi(true);
    setAiSaveMsg("");
    try {
      const res = await aiBotApi.updateConfig({
        isEnabled: aiConfig.isEnabled,
        provider: aiConfig.provider,
        model: aiConfig.model,
        systemPrompt: aiConfig.systemPrompt,
        knowledgeBase: aiConfig.knowledgeBase,
        handoverKeywords: Array.isArray(aiConfig.handoverKeywords)
          ? aiConfig.handoverKeywords
          : typeof aiConfig.handoverKeywords === "string"
            ? (aiConfig.handoverKeywords as string)
                .split(",")
                .map((k) => k.trim())
                .filter(Boolean)
            : [],
        handoverMessage: aiConfig.handoverMessage,
        handoverDurationMinutes: aiConfig.handoverDurationMinutes,
        targetSessionIds: aiConfig.targetSessionIds,
        scheduleMode: aiConfig.scheduleMode,
        workHoursStart: aiConfig.workHoursStart,
        workHoursEnd: aiConfig.workHoursEnd,
        workDays: aiConfig.workDays,
        temperature: aiConfig.temperature,
        maxTokens: aiConfig.maxTokens,
        contextWindow: aiConfig.contextWindow,
        senderFilterMode: aiConfig.senderFilterMode || "all",
        whitelistNumbers: aiConfig.whitelistNumbers || [],
        blacklistNumbers: aiConfig.blacklistNumbers || [],
        ignoreGroups: aiConfig.ignoreGroups !== false,
        apiKey: aiKeyInput.trim() || undefined,
      });
      if (res.data) {
        setAiSaveMsg(
          t("toast.saved_success", "Konfigurasi AI Bot berhasil disimpan!"),
        );
        setAiKeyInput("");
        void loadAiConfig();
        setTimeout(() => setAiSaveMsg(""), 3000);
      }
    } catch (err: unknown) {
      console.error("Save AI config error", err);
    } finally {
      setSavingAi(false);
    }
  };

  const handleTestAi = async (customPrompt?: string) => {
    const textToSend = customPrompt || testInput.trim();
    if (!textToSend || testingAi) return;

    const timeNow = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    setSimulatorChat((prev) => [
      ...prev,
      { role: "user", text: textToSend, time: timeNow },
    ]);
    setTestInput("");
    setTestingAi(true);

    try {
      const res = await aiBotApi.testPrompt(textToSend);
      const reply =
        res.data?.reply ||
        t(
          "autoreply.no_reply_err",
          "Tidak ada balasan dari model. Pastikan API key aktif.",
        );
      setSimulatorChat((prev) => [
        ...prev,
        {
          role: "bot",
          text: reply,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } catch {
      setSimulatorChat((prev) => [
        ...prev,
        {
          role: "bot",
          text: t(
            "autoreply.test_err",
            "Gagal memproses pertanyaan ke model AI. Periksa API key dan kuota model Anda.",
          ),
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } finally {
      setTestingAi(false);
      setTimeout(
        () => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }),
        100,
      );
    }
  };

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };
  const openEdit = (rule: AutoReplyRule) => {
    setEditing(rule);
    setShowForm(true);
  };
  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const handleSubmit = async (form: RuleForm) => {
    const res = editing ? await update(editing.id, form) : await create(form);
    if (res.success) closeForm();
    return res;
  };

  const handleDelete = async (id: string) => {
    await remove(id);
    setDeleteId(null);
  };

  return (
    <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-5">
      {/* Action Bar & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-3 sm:pb-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("rules")}
            className={`flex items-center gap-2 px-3 py-1.5 sm:px-3.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === "rules"
                ? "bg-brand-600/20 text-brand-400 border border-brand-500/30"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>{t("autoreply.rules_tab", "Aturan Kata Kunci")} ({rules.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("ai")}
            className={`flex items-center gap-2 px-3 py-1.5 sm:px-3.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === "ai"
                ? "bg-purple-600/20 text-purple-300 border border-purple-500/30"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>{t("autoreply.ai_tab", "AI Bot Assistant")}</span>
            {aiConfig.isEnabled && (
              <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* Right Actions for Keyword Rules */}
        {activeTab === "rules" && (
          <div className="flex gap-2 self-start sm:self-auto">
            <button
              onClick={() => void load()}
              className="btn-secondary text-xs"
              disabled={loading}
              title={t("actions.refresh", "Refresh")}
            >
              <RefreshCw
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${loading ? "animate-spin" : ""}`}
              />
            </button>
            <button
              onClick={openCreate}
              className="btn-primary text-xs shadow-lg shadow-brand-500/20"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{t("autoreply.add_rule", "Tambah Aturan")}</span>
            </button>
          </div>
        )}
      </div>

      {/* Tab 1: Keyword Rules */}
      {activeTab === "rules" && (
        <>
          {rules.length === 0 && !loading ? (
            <EmptyState
              icon={Bot}
              title={t("autoreply.title", "Belum ada aturan auto-reply")}
              description={t(
                "autoreply.subtitle",
                "Buat aturan pesan otomatis berdasarkan kecocokan kata kunci dari pengirim WhatsApp.",
              )}
              action={
                <button onClick={openCreate} className="btn-primary text-xs shadow-lg shadow-brand-500/20">
                  <Plus className="w-4 h-4" /> {t("autoreply.add_rule", "Buat Aturan Baru")}
                </button>
              }
            />
          ) : (
            <AutoReplyTable
              rules={rules}
              sessionName={sessionName}
              onToggle={toggleActive}
              onEdit={openEdit}
              onDelete={setDeleteId}
            />
          )}

          {showForm && (
            <AutoReplyForm
              editing={editing}
              sessions={sessions}
              onSubmit={handleSubmit}
              onClose={closeForm}
            />
          )}

          {/* Delete Confirm */}
          {deleteId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
              <div className="card p-6 max-w-sm w-full space-y-4 shadow-2xl border-gray-750">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {t("confirm.delete_title", "Hapus Aturan")}
                </h3>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                  {t("confirm.delete_desc", "Apakah Anda yakin ingin menghapus aturan pesan otomatis ini?")}
                </p>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setDeleteId(null)}
                    className="btn-secondary text-xs"
                  >
                    {t("actions.cancel", "Batal")}
                  </button>
                  <button
                    onClick={() => void handleDelete(deleteId)}
                    className="btn-danger text-xs"
                  >
                    {t("actions.delete", "Hapus")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Tab 2: AI Assistant Bot Settings */}
      {activeTab === "ai" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Form: Settings */}
          <div className="lg:col-span-2 card p-4 sm:p-6 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  {t("autoreply.ai_title", "AI WhatsApp Assistant (LLM Auto-Responder)")}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {t("autoreply.ai_desc", "Pesan masuk yang tidak cocok dengan kata kunci manual akan dijawab cerdas oleh AI secara otomatis.")}
                </p>
              </div>

              {/* Master Toggle */}
              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                <input
                  type="checkbox"
                  checked={aiConfig.isEnabled}
                  onChange={(e) =>
                    setAiConfig((prev) => ({
                      ...prev,
                      isEnabled: e.target.checked,
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
              </label>
            </div>

            <form onSubmit={handleSaveAiConfig} className="space-y-4">
              {/* Provider & Model Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    {t("autoreply.provider", "AI Provider")}
                  </label>
                  <select
                    value={aiConfig.provider}
                    onChange={(e) => {
                      const newProv = e.target.value as any;
                      const defaultMod =
                        PROVIDER_MODELS[newProv]?.[0]?.id || "gemini-2.0-flash";
                      setAiConfig((prev) => ({
                        ...prev,
                        provider: newProv,
                        model: defaultMod,
                      }));
                    }}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="gemini">{t("autoreply.prov_gemini", "Google Gemini (Gratis & Cepat)")}</option>
                    <option value="grok">{t("autoreply.prov_grok", "xAI Grok (Grok-2 / Vision)")}</option>
                    <option value="deepseek">{t("autoreply.prov_deepseek", "DeepSeek Direct API (Hemat & Pintar)")}</option>
                    <option value="openai">{t("autoreply.prov_openai", "OpenAI (GPT-4o / o3-mini)")}</option>
                    <option value="openrouter">{t("autoreply.prov_openrouter", "OpenRouter (Claude 3.5 / Llama / Grok)")}</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-gray-300">
                      {t("autoreply.model", "Model AI")}
                    </label>
                    <span className="text-[10px] text-emerald-400 font-medium">● Non-deprecated</span>
                  </div>
                  <select
                    value={
                      (PROVIDER_MODELS[aiConfig.provider] || []).some((m) => m.id === aiConfig.model)
                        ? aiConfig.model
                        : "__custom__"
                    }
                    onChange={(e) => {
                      if (e.target.value === "__custom__") {
                        setAiConfig((prev) => ({ ...prev, model: "" }));
                      } else {
                        setAiConfig((prev) => ({ ...prev, model: e.target.value }));
                      }
                    }}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                  >
                    {(PROVIDER_MODELS[aiConfig.provider] || []).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                    <option value="__custom__">{t("autoreply.model_custom_opt", "✏️ Model Kustom / Input Manual...")}</option>
                  </select>

                  {!((PROVIDER_MODELS[aiConfig.provider] || []).some((m) => m.id === aiConfig.model)) && (
                    <div className="mt-2 animate-in fade-in duration-150">
                      <input
                        type="text"
                        value={aiConfig.model}
                        onChange={(e) => setAiConfig((prev) => ({ ...prev, model: e.target.value }))}
                        placeholder={t("autoreply.model_custom_placeholder", "Ketik model ID spesifik (contoh: gemini-2.0-flash-lite, o3-mini)")}
                        className="w-full bg-gray-900 border border-purple-600/60 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 font-mono focus:outline-none focus:border-purple-400"
                      />
                    </div>
                  )}
                  <p className="text-[10px] text-gray-500 mt-1">
                    {t("autoreply.model_active_note", "Hanya model aktif resmi non-deprecated yang disediakan untuk stabilitas koneksi.")}
                  </p>
                </div>
              </div>

              {/* API Key */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  {t("autoreply.api_key", "API Key")} {aiConfig.hasKey && t("autoreply.api_key_stored", "(Tersimpan)")}
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={aiKeyInput}
                    onChange={(e) => setAiKeyInput(e.target.value)}
                    placeholder={
                      aiConfig.hasKey
                        ? `Tersimpan: ${aiConfig.apiKeyMasked} (kosongkan jika tidak diubah)`
                        : aiConfig.provider === "gemini"
                        ? "Masukkan API Key Google Gemini (AIzaSy...)"
                        : aiConfig.provider === "grok"
                        ? "Masukkan API Key xAI Grok (xai-...)"
                        : aiConfig.provider === "deepseek"
                        ? "Masukkan API Key DeepSeek (sk-...)"
                        : `Masukkan API Key ${aiConfig.provider.toUpperCase()}...`
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  {t("autoreply.api_key_help", "Kunci API Anda dienkripsi dan disimpan khusus untuk akun Anda sendiri (terisolasi).")}
                </p>
              </div>

              {/* Session Binding */}
              <div className="p-3 rounded-xl bg-gray-800/40 border border-gray-700/50 space-y-2.5">
                <label className="block text-xs font-semibold text-gray-200 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-purple-400" />
                  <span>{t("autoreply.session_scope", "Cakupan Nomor Sesi WhatsApp")}</span>
                </label>
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                    <input
                      type="radio"
                      name="sessionBindingMode"
                      checked={
                        !aiConfig.targetSessionIds ||
                        aiConfig.targetSessionIds.length === 0
                      }
                      onChange={() =>
                        setAiConfig((prev) => ({
                          ...prev,
                          targetSessionIds: [],
                        }))
                      }
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span>{t("autoreply.all_sessions", "Semua Sesi Aktif")} ({sessions.length})</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                    <input
                      type="radio"
                      name="sessionBindingMode"
                      checked={
                        !!(
                          aiConfig.targetSessionIds &&
                          aiConfig.targetSessionIds.length > 0
                        )
                      }
                      onChange={() => {
                        if (
                          sessions.length > 0 &&
                          (!aiConfig.targetSessionIds ||
                            aiConfig.targetSessionIds.length === 0)
                        ) {
                          setAiConfig((prev) => ({
                            ...prev,
                            targetSessionIds: [sessions[0].id],
                          }));
                        }
                      }}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span>{t("autoreply.select_sessions", "Pilih Sesi Tertentu Saja")}</span>
                  </label>
                </div>

                {aiConfig.targetSessionIds &&
                  aiConfig.targetSessionIds.length > 0 && (
                    <div className="pt-2 border-t border-gray-700/50 space-y-2">
                      <p className="text-[11px] text-gray-400">
                        {t("autoreply.select_sessions_desc", "Pilih nomor WhatsApp yang akan dijawab otomatis oleh AI:")}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {sessions.map((s) => {
                          const isChecked = aiConfig.targetSessionIds?.includes(
                            s.id,
                          );
                          return (
                            <label
                              key={s.id}
                              className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                                isChecked
                                  ? "bg-purple-950/40 border-purple-800/60 text-purple-200"
                                  : "bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const curr = aiConfig.targetSessionIds || [];
                                  const next = e.target.checked
                                    ? [...curr, s.id]
                                    : curr.filter((id) => id !== s.id);
                                  setAiConfig((prev) => ({
                                    ...prev,
                                    targetSessionIds: next,
                                  }));
                                }}
                                className="rounded text-purple-600 focus:ring-purple-500"
                              />
                              <div className="min-w-0">
                                <p className="font-semibold truncate">{s.name}</p>
                                <p className="text-[10px] text-gray-500 font-mono truncate">
                                  {s.id.slice(0, 10)}…
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
              </div>

              {/* Sender Phone Number Filtering (Whitelist / Blacklist) */}
              <div className="p-3 rounded-xl bg-gray-800/40 border border-gray-700/50 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="block text-xs font-semibold text-gray-200 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-purple-400" />
                    <span>{t("autoreply.sender_filter_title", "Filter Kontak Pengirim (Pelanggan)")}</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] text-gray-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aiConfig.ignoreGroups !== false}
                      onChange={(e) =>
                        setAiConfig((prev) => ({
                          ...prev,
                          ignoreGroups: e.target.checked,
                        }))
                      }
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span>{t("autoreply.ignore_groups", "Abaikan Chat Grup (Hanya DM)")}</span>
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                    <input
                      type="radio"
                      name="senderFilterMode"
                      checked={!aiConfig.senderFilterMode || aiConfig.senderFilterMode === "all"}
                      onChange={() =>
                        setAiConfig((prev) => ({
                          ...prev,
                          senderFilterMode: "all",
                        }))
                      }
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span>{t("autoreply.sender_all", "Semua Kontak Pengirim")}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                    <input
                      type="radio"
                      name="senderFilterMode"
                      checked={aiConfig.senderFilterMode === "whitelist"}
                      onChange={() =>
                        setAiConfig((prev) => ({
                          ...prev,
                          senderFilterMode: "whitelist",
                        }))
                      }
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span>{t("autoreply.sender_whitelist", "Hanya Nomor Tertentu (Whitelist)")}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                    <input
                      type="radio"
                      name="senderFilterMode"
                      checked={aiConfig.senderFilterMode === "blacklist"}
                      onChange={() =>
                        setAiConfig((prev) => ({
                          ...prev,
                          senderFilterMode: "blacklist",
                        }))
                      }
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span>{t("autoreply.sender_blacklist", "Kecualikan Nomor Tertentu (Blacklist)")}</span>
                  </label>
                </div>

                {/* Whitelist Input */}
                {aiConfig.senderFilterMode === "whitelist" && (
                  <div className="pt-2 border-t border-gray-700/50 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-purple-300 font-medium">
                        {t("autoreply.whitelist_desc", "Hanya nomor di bawah ini yang akan dibalas otomatis oleh AI:")}
                      </span>
                      <span className="text-gray-400 font-mono text-[10px]">
                        {(aiConfig.whitelistNumbers || []).length} {t("autoreply.numbers_count", "nomor")}
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      value={(aiConfig.whitelistNumbers || []).join(", ")}
                      onChange={(e) => {
                        const nums = e.target.value
                          .split(/[\n,;]+/)
                          .map((n) => n.trim().replace(/\D/g, ""))
                          .filter(Boolean);
                        setAiConfig((prev) => ({
                          ...prev,
                          whitelistNumbers: Array.from(new Set(nums)),
                        }));
                      }}
                      placeholder="628123456789, 628987654321, 085712345678"
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-xs text-white placeholder-gray-500 font-mono focus:outline-none focus:border-purple-500 leading-relaxed"
                    />
                    <p className="text-[10px] text-gray-500">
                      {t("autoreply.numbers_format_help", "Pisahkan nomor dengan tanda koma (,) atau baris baru. Kontak lain akan dibiarkan untuk dibalas manual.")}
                    </p>
                  </div>
                )}

                {/* Blacklist Input */}
                {aiConfig.senderFilterMode === "blacklist" && (
                  <div className="pt-2 border-t border-gray-700/50 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-yellow-300 font-medium">
                        {t("autoreply.blacklist_desc", "Nomor di bawah ini TIDAK akan pernah dibalas oleh AI (misal: keluarga, atasan, internal):")}
                      </span>
                      <span className="text-gray-400 font-mono text-[10px]">
                        {(aiConfig.blacklistNumbers || []).length} {t("autoreply.numbers_count", "nomor")}
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      value={(aiConfig.blacklistNumbers || []).join(", ")}
                      onChange={(e) => {
                        const nums = e.target.value
                          .split(/[\n,;]+/)
                          .map((n) => n.trim().replace(/\D/g, ""))
                          .filter(Boolean);
                        setAiConfig((prev) => ({
                          ...prev,
                          blacklistNumbers: Array.from(new Set(nums)),
                        }));
                      }}
                      placeholder="628111222333, 628999888777"
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-xs text-white placeholder-gray-500 font-mono focus:outline-none focus:border-purple-500 leading-relaxed"
                    />
                    <p className="text-[10px] text-gray-500">
                      {t("autoreply.blacklist_help", "Pisahkan nomor dengan tanda koma (,) atau baris baru. Kontak di daftar ini akan selalu manual.")}
                    </p>
                  </div>
                )}
              </div>

              {/* Schedule Mode / Jam Kerja */}
              <div className="p-3 rounded-xl bg-gray-800/40 border border-gray-700/50 space-y-2.5">
                <label className="block text-xs font-semibold text-gray-200 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                  <span>{t("autoreply.schedule_title", "Jadwal Operasional AI Bot")}</span>
                </label>
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                    <input
                      type="radio"
                      name="scheduleMode"
                      checked={aiConfig.scheduleMode !== "after_hours"}
                      onChange={() =>
                        setAiConfig((prev) => ({
                          ...prev,
                          scheduleMode: "always",
                        }))
                      }
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span>{t("autoreply.always_active", "Selalu Aktif (24 Jam)")}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                    <input
                      type="radio"
                      name="scheduleMode"
                      checked={aiConfig.scheduleMode === "after_hours"}
                      onChange={() =>
                        setAiConfig((prev) => ({
                          ...prev,
                          scheduleMode: "after_hours",
                        }))
                      }
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span>{t("autoreply.after_hours", "Hanya di Luar Jam Kerja (After Hours)")}</span>
                  </label>
                </div>

                {aiConfig.scheduleMode === "after_hours" && (
                  <div className="pt-2 border-t border-gray-700/50 space-y-2 text-xs">
                    <p className="text-[11px] text-gray-400">
                      {t("autoreply.schedule_help", "Selama jam kerja, pesan dilayani staf CS manusia. Di luar jam ini, AI otomatis mengambil alih:")}
                    </p>
                    <div className="grid grid-cols-2 gap-3 max-w-sm">
                      <div>
                        <label className="block text-[11px] text-gray-400 mb-1">
                          {t("autoreply.work_hours_start", "Jam Kerja Mulai")}
                        </label>
                        <input
                          type="time"
                          value={aiConfig.workHoursStart || "08:00"}
                          onChange={(e) =>
                            setAiConfig((prev) => ({
                              ...prev,
                              workHoursStart: e.target.value,
                            }))
                          }
                          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-gray-400 mb-1">
                          {t("autoreply.work_hours_end", "Jam Kerja Selesai")}
                        </label>
                        <input
                          type="time"
                          value={aiConfig.workHoursEnd || "17:00"}
                          onChange={(e) =>
                            setAiConfig((prev) => ({
                              ...prev,
                              workHoursEnd: e.target.value,
                            }))
                          }
                          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sliders: Temperature, Max Tokens & Context Window */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3 rounded-xl bg-gray-800/40 border border-gray-700/50">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-300 font-medium">
                      {t("autoreply.creativity", "Kreativitas (Temp)")}
                    </span>
                    <span className="font-mono text-purple-400 font-semibold">
                      {aiConfig.temperature ?? 0.7}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={aiConfig.temperature ?? 0.7}
                    onChange={(e) =>
                      setAiConfig((prev) => ({
                        ...prev,
                        temperature: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                    <span>{t("autoreply.temp_factual", "0.0 Faktual")}</span>
                    <span>{t("autoreply.temp_creative", "1.0 Luwes")}</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-300 font-medium">
                      {t("autoreply.max_tokens", "Maks. Tokens")}
                    </span>
                    <span className="font-mono text-purple-400 font-semibold">
                      {aiConfig.maxTokens ?? 500}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="2000"
                    step="50"
                    value={aiConfig.maxTokens ?? 500}
                    onChange={(e) =>
                      setAiConfig((prev) => ({
                        ...prev,
                        maxTokens: parseInt(e.target.value),
                      }))
                    }
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                    <span>{t("autoreply.tokens_short", "100 Ringkas")}</span>
                    <span>{t("autoreply.tokens_long", "2000 Panjang")}</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-300 font-medium">
                      {t("autoreply.chat_memory", "Memori Chat")}
                    </span>
                    <span className="font-mono text-purple-400 font-semibold">
                      {t("autoreply.context_messages", { count: aiConfig.contextWindow ?? 8 }, `${aiConfig.contextWindow ?? 8} Pesan`)}
                    </span>
                  </div>
                  <select
                    value={aiConfig.contextWindow ?? 8}
                    onChange={(e) =>
                      setAiConfig((prev) => ({
                        ...prev,
                        contextWindow: parseInt(e.target.value),
                      }))
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value={4}>{t("autoreply.context_opt_4", "4 Pesan (Hemat Token)")}</option>
                    <option value={8}>{t("autoreply.context_opt_8", "8 Pesan (Standar)")}</option>
                    <option value={12}>{t("autoreply.context_opt_12", "12 Pesan (Lanjutan)")}</option>
                    <option value={16}>{t("autoreply.context_opt_16", "16 Pesan (Konsultasi)")}</option>
                    <option value={20}>{t("autoreply.context_opt_20", "20 Pesan (Konteks Penuh)")}</option>
                  </select>
                  <p className="text-[10px] text-gray-500 mt-1">{t("autoreply.chat_memory_help", "Riwayat chat yang dibaca AI")}</p>
                </div>
              </div>

              {/* System Prompt */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  {t("autoreply.prompt_title", "System Prompt (Instruksi Perilaku Bot)")}
                </label>
                <textarea
                  rows={3}
                  value={aiConfig.systemPrompt}
                  onChange={(e) =>
                    setAiConfig((prev) => ({
                      ...prev,
                      systemPrompt: e.target.value,
                    }))
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 font-sans leading-relaxed"
                />
              </div>

              {/* Knowledge Base */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-200">
                    {t("autoreply.kb_title", "Knowledge Base & Dokumen FAQ")}
                  </label>
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
                      disabled={uploadingDoc}
                      onClick={() => kbFileInputRef.current?.click()}
                      className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium bg-purple-950/40 border border-purple-800/50 px-2 py-0.5 rounded-md transition-colors disabled:opacity-50"
                      title={t("autoreply.upload_kb_title", "Upload dokumen pengetahuan (.pdf, .txt, .md, .csv, .json)")}
                    >
                      {uploadingDoc ? (
                        <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
                      ) : (
                        <Upload className="w-3 h-3" />
                      )}
                      <span>
                        {uploadingDoc
                          ? t("autoreply.extracting_doc", "Mengekstrak...")
                          : t("autoreply.upload_doc", "Upload Dokumen (.pdf, .txt, .csv)")}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Quick Templates */}
                <div className="mb-2">
                  <p className="text-[10px] text-gray-400 mb-1">
                    {t("autoreply.use_ready_template", "Gunakan template siap pakai:")}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {KB_TEMPLATES.map((tpl, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setAiConfig((prev) => ({
                            ...prev,
                            systemPrompt: tpl.prompt,
                            knowledgeBase: tpl.kb,
                          }));
                        }}
                        className="text-[11px] bg-gray-800/80 hover:bg-gray-750 text-gray-300 border border-gray-700/60 px-2 py-1 rounded-md transition-colors text-left"
                      >
                        {tpl.label}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  rows={4}
                  value={aiConfig.knowledgeBase || ""}
                  onChange={(e) =>
                    setAiConfig((prev) => ({
                      ...prev,
                      knowledgeBase: e.target.value,
                    }))
                  }
                  placeholder={t(
                    "autoreply.kb_placeholder",
                    "Ketik atau tempelkan FAQ, daftar harga, katalog produk, atau ketentuan garansi di sini...",
                  )}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 font-sans leading-relaxed"
                />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-gray-500 mt-1.5 gap-1.5">
                  <span>
                    {t(
                      "autoreply.kb_help",
                      "Mendukung teks acuan untuk menjawab pertanyaan pelanggan secara otomatis.",
                    )}
                  </span>
                  <div className="flex items-center gap-2 font-mono shrink-0">
                    <span className="text-gray-400">
                      {(aiConfig.knowledgeBase || "").length.toLocaleString()}{" "}
                      {t("common.characters", "karakter")}
                    </span>
                    <span>•</span>
                    <span className="text-purple-300">
                      ~{Math.ceil(((aiConfig.knowledgeBase || "").length) / 4).toLocaleString()} tokens
                    </span>
                    {Math.ceil(((aiConfig.knowledgeBase || "").length) / 4) < 8000 ? (
                      <span className="text-[10px] font-sans px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/50">
                        {t("autoreply.kb_optimal", "Optimal")}
                      </span>
                    ) : Math.ceil(((aiConfig.knowledgeBase || "").length) / 4) < 16000 ? (
                      <span className="text-[10px] font-sans px-1.5 py-0.5 rounded bg-yellow-950/60 text-yellow-300 border border-yellow-800/50">
                        {t("autoreply.kb_medium", "Cukup Besar")}
                      </span>
                    ) : (
                      <span className="text-[10px] font-sans px-1.5 py-0.5 rounded bg-red-950/60 text-red-300 border border-red-800/50">
                        {t("autoreply.kb_heavy", "Mendekati Batas")}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Handover & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    {t("autoreply.handover_kw", "Kata Kunci Handover CS (Manusia)")}
                  </label>
                  <input
                    type="text"
                    value={
                      Array.isArray(aiConfig.handoverKeywords)
                        ? aiConfig.handoverKeywords.join(", ")
                        : aiConfig.handoverKeywords || ""
                    }
                    onChange={(e) =>
                      setAiConfig((prev) => ({
                        ...prev,
                        handoverKeywords: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      }))
                    }
                    placeholder="cs, admin, human, manusia, bantuan"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    {t("autoreply.handover_duration", "Durasi Jeda AI Setelah Alih CS")}
                  </label>
                  <select
                    value={aiConfig.handoverDurationMinutes ?? 120}
                    onChange={(e) =>
                      setAiConfig((prev) => ({
                        ...prev,
                        handoverDurationMinutes: parseInt(e.target.value),
                      }))
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value={30}>{t("autoreply.handover_30m", "30 Menit")}</option>
                    <option value={60}>{t("autoreply.handover_1h", "1 Jam")}</option>
                    <option value={120}>{t("autoreply.handover_2h", "2 Jam (Rekomendasi)")}</option>
                    <option value={360}>{t("autoreply.handover_6h", "6 Jam")}</option>
                    <option value={1440}>{t("autoreply.handover_24h", "24 Jam")}</option>
                  </select>
                </div>
              </div>

              {/* Handover Message */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  {t("autoreply.handover_msg_label", "Pesan Notifikasi Handover ke Pelanggan")}
                </label>
                <input
                  type="text"
                  value={aiConfig.handoverMessage || ""}
                  onChange={(e) =>
                    setAiConfig((prev) => ({
                      ...prev,
                      handoverMessage: e.target.value,
                    }))
                  }
                  placeholder="Baik kak, pesan Anda telah dialihkan ke CS..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              {aiSaveMsg && (
                <div className="p-2.5 rounded-lg bg-purple-950/60 border border-purple-800/60 text-xs text-purple-300 flex items-center gap-2 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-purple-400" />
                  <span>{aiSaveMsg}</span>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingAi}
                  className="btn-primary bg-purple-600 hover:bg-purple-500 border-none px-4 py-2 text-xs shadow-lg shadow-purple-600/25"
                >
                  {savingAi
                    ? t("status.saving", "Menyimpan...")
                    : t("actions.save", "Simpan Konfigurasi AI")}
                </button>
              </div>
            </form>
          </div>

          {/* Right Panel: WhatsApp Chat Simulator */}
          <div className="card p-0 flex flex-col h-[520px] sm:h-[650px] overflow-hidden border-gray-750 shadow-2xl">
            {/* Simulator Header */}
            <div className="px-4 py-3 bg-emerald-950/40 border-b border-emerald-900/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white leading-tight">
                    {t("autoreply.simulator_title", "WhatsApp Bot Simulator")}
                  </p>
                  <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online • {aiConfig.provider} ({aiConfig.model})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSimulatorChat([
                    {
                      role: "bot",
                      text: t("autoreply.sim_reset_text", "Percakapan telah direset. Silakan ajukan pertanyaan baru!"),
                      time: new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      }),
                    },
                  ])
                }
                className="text-[11px] text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-800 transition-colors flex items-center gap-1"
                title="Reset riwayat simulasi"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t("autoreply.reset_sim", "Reset")}</span>
              </button>
            </div>

            {/* Quick Questions Pills */}
            <div className="px-3 py-2 bg-gray-900/60 border-b border-gray-800/60 flex items-center gap-1.5 overflow-x-auto">
              <span className="text-[10px] text-gray-500 shrink-0">{t("autoreply.quick_test", "Tes cepat:")}</span>
              {[
                "Berapa harga paket?",
                "Jam berapa buka?",
                "Bisa transfer bank?",
                "Mau bicara dengan CS",
              ].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => void handleTestAi(q)}
                  disabled={testingAi}
                  className="px-2 py-0.5 rounded-full bg-gray-800 hover:bg-gray-750 text-[10px] text-gray-300 border border-gray-700/60 whitespace-nowrap transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-950/80">
              {simulatorChat.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs shadow-md space-y-1 ${
                      msg.role === "user"
                        ? "bg-emerald-700 text-white rounded-tr-none"
                        : "bg-gray-800 text-gray-200 border border-gray-700/60 rounded-tl-none"
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    <p
                      className={`text-[9px] text-right font-mono ${
                        msg.role === "user"
                          ? "text-emerald-200/70"
                          : "text-gray-400"
                      }`}
                    >
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}

              {testingAi && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 border border-gray-700/60 rounded-2xl rounded-tl-none px-3.5 py-2 text-xs text-gray-400 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
                    <span className="text-[11px] ml-1">{t("autoreply.ai_thinking", "AI sedang berpikir...")}</span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleTestAi();
              }}
              className="p-3 bg-gray-900 border-t border-gray-800 flex items-center gap-2"
            >
              <input
                type="text"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder={t("autoreply.test_placeholder", "Ketik pertanyaan untuk bot...")}
                disabled={testingAi}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={testingAi || !testInput.trim()}
                className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 transition-colors"
                title="Kirim pesan simulasi"
              >
                <Send className={`w-4 h-4 ${testingAi ? "animate-spin" : ""}`} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
