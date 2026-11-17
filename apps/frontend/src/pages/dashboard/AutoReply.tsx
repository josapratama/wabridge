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
  HelpCircle,
  Upload,
  FileText,
  BookOpen,
} from "lucide-react";
import {
  useAutoReply,
  RuleForm,
} from "../../features/auto-reply/hooks/useAutoReply";
import AutoReplyForm from "../../features/auto-reply/components/AutoReplyForm";
import AutoReplyTable from "../../features/auto-reply/components/AutoReplyTable";
import { useI18n } from "../../context/I18nContext";

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
    model: "gemini-1.5-flash",
    systemPrompt:
      "Anda adalah customer support WhatsApp yang ramah dan solutif. Jawab pertanyaan pelanggan dengan singkat, sopan, dan jelas.",
  });
  const [aiKeyInput, setAiKeyInput] = useState("");
  const [savingAi, setSavingAi] = useState(false);
  const [aiSaveMsg, setAiSaveMsg] = useState("");
  const [testInput, setTestInput] = useState("");
  const [testReply, setTestReply] = useState("");
  const [testingAi, setTestingAi] = useState(false);
  const kbFileInputRef = useRef<HTMLInputElement>(null);

  const KB_TEMPLATES = [
    {
      label: "🛍️ Toko Online / E-Commerce",
      prompt: "Anda adalah customer support toko online yang ramah, sopan, dan solutif. Bantu calon pembeli memilih produk, menjawab info harga, ongkir, serta cara pembayaran.",
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
      prompt: "Anda adalah AI Assistant WaBridge. Berikan informasi yang akurat, ringkas, dan jelas sesuai basis pengetahuan perusahaan.",
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
      prompt: "Anda adalah asisten administrasi klinik. Bantu pasien mengetahui jadwal dokter, biaya konsultasi, dan alur pendaftaran.",
      kb: `[JADWAL PRAKTIK DOKTER]
- dr. Spesialis Anak: Senin - Jumat, 09.00 - 13.00
- dr. Gigi & Mulut: Selasa & Kamis, 14.00 - 18.00
- dr. Umum: Setiap hari 24 Jam

[ALUR PENDAFTARAN]
Kirim format: Nama Pasien # No KTP # Poli Tujuan # Tanggal Kunjungan`,
    },
  ];

  const handleKbFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      setAiConfig((prev) => ({
        ...prev,
        knowledgeBase: prev.knowledgeBase ? `${prev.knowledgeBase}\n\n${text}` : text,
      }));
    };
    reader.readAsText(file);
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
        handoverKeywords:
          typeof aiConfig.handoverKeywords === "string"
            ? (aiConfig.handoverKeywords as string)
                .split(",")
                .map((k) => k.trim())
                .filter(Boolean)
            : aiConfig.handoverKeywords,
        handoverMessage: aiConfig.handoverMessage,
        apiKey: aiKeyInput.trim() || undefined,
      });
      if (res.data) {
        setAiSaveMsg(t("toast.saved_success", "AI Bot configuration saved successfully!"));
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

  const handleTestAi = async () => {
    if (!testInput.trim()) return;
    setTestingAi(true);
    setTestReply("");
    try {
      const res = await aiBotApi.testPrompt(testInput.trim());
      if (res.data?.reply) {
        setTestReply(res.data.reply);
      } else {
        setTestReply("No reply received. Make sure your API Key is valid.");
      }
    } catch {
      setTestReply("Error testing AI response. Please check your API key.");
    } finally {
      setTestingAi(false);
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
    <div className="p-6 space-y-5">
      {/* Action Bar & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("rules")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === "rules"
                ? "bg-brand-600/20 text-brand-400 border border-brand-500/30"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>Keyword Rules ({rules.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("ai")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === "ai"
                ? "bg-purple-600/20 text-purple-300 border border-purple-500/30"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>AI Assistant Bot</span>
            {aiConfig.isEnabled && (
              <span className="w-2 h-2 rounded-full bg-brand-400" />
            )}
          </button>
        </div>

        {/* Right Actions */}
        {activeTab === "rules" && (
          <div className="flex gap-2">
            <button
              onClick={() => void load()}
              className="btn-secondary"
              disabled={loading}
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
            </button>
            <button onClick={openCreate} className="btn-primary">
              <Plus className="w-4 h-4" /> {t("autoreply.add_rule", "New Rule")}
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
              title={t("autoreply.title", "No auto-reply rules")}
              description={t("autoreply.subtitle", "Create rules to automatically reply when inbound messages match specific keywords.")}
              action={
                <button onClick={openCreate} className="btn-primary">
                  <Plus className="w-4 h-4" /> {t("autoreply.add_rule", "Create Rule")}
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="card p-6 max-w-sm w-full space-y-4">
                <h3 className="text-base font-bold text-white">{t("confirm.delete_title", "Delete Rule")}</h3>
                <p className="text-sm text-gray-400">
                  {t("confirm.delete_desc", "Are you sure you want to delete this auto-reply rule?")}
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setDeleteId(null)}
                    className="btn-secondary"
                  >
                    {t("actions.cancel", "Cancel")}
                  </button>
                  <button
                    onClick={() => void handleDelete(deleteId)}
                    className="btn-danger"
                  >
                    {t("actions.delete", "Delete")}
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
          <div className="lg:col-span-2 card p-6 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  AI WhatsApp Assistant (LLM Auto-Responder)
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  When enabled, incoming messages that do not match manual keywords will be answered intelligently by AI.
                </p>
              </div>

              {/* Master Toggle */}
              <label className="relative inline-flex items-center cursor-pointer">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    AI Provider
                  </label>
                  <select
                    value={aiConfig.provider}
                    onChange={(e) =>
                      setAiConfig((prev) => ({
                        ...prev,
                        provider: e.target.value as any,
                        model:
                          e.target.value === "gemini"
                            ? "gemini-1.5-flash"
                            : "gpt-4o-mini",
                      }))
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="gemini">Google Gemini (Recommended)</option>
                    <option value="openai">OpenAI (ChatGPT)</option>
                    <option value="openrouter">OpenRouter (Claude/DeepSeek)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Model
                  </label>
                  <input
                    type="text"
                    value={aiConfig.model}
                    onChange={(e) =>
                      setAiConfig((prev) => ({ ...prev, model: e.target.value }))
                    }
                    placeholder="e.g. gemini-1.5-flash, gpt-4o-mini"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  API Key {aiConfig.hasKey && "(Configured)"}
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={aiKeyInput}
                    onChange={(e) => setAiKeyInput(e.target.value)}
                    placeholder={
                      aiConfig.hasKey
                        ? `Stored: ${aiConfig.apiKeyMasked} (leave blank to keep unchanged)`
                        : "Enter API Key..."
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-gray-300">
                    System Prompt
                  </label>
                </div>
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

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-200">
                    Knowledge Base & Dokumen FAQ
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={kbFileInputRef}
                      onChange={handleKbFileUpload}
                      accept=".txt,.md,.json,.csv"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => kbFileInputRef.current?.click()}
                      className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium bg-purple-950/40 border border-purple-800/50 px-2 py-0.5 rounded-md transition-colors"
                      title={t("autoreply.upload_kb_title", "Upload dokumen pengetahuan (.txt, .md, .csv, .json)")}
                    >
                      <Upload className="w-3 h-3" />
                      <span>{t("autoreply.upload_doc", "Upload Dokumen")}</span>
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
                  rows={5}
                  value={aiConfig.knowledgeBase || ""}
                  onChange={(e) =>
                    setAiConfig((prev) => ({
                      ...prev,
                      knowledgeBase: e.target.value,
                    }))
                  }
                  placeholder={t("autoreply.kb_placeholder", "Ketik atau tempelkan FAQ, daftar harga, katalog produk, atau ketentuan garansi di sini...")}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 font-sans leading-relaxed"
                />
                <p className="text-[10px] text-gray-500 mt-1 flex justify-between">
                  <span>{t("autoreply.kb_help", "Mendukung teks acuan untuk menjawab pertanyaan pelanggan secara otomatis.")}</span>
                  <span>{aiConfig.knowledgeBase?.length || 0} {t("common.characters", "karakter")}</span>
                </p>
              </div>

              {aiSaveMsg && (
                <div className="p-2.5 rounded-lg bg-purple-950/60 border border-purple-800/60 text-xs text-purple-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{aiSaveMsg}</span>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingAi}
                  className="btn-primary bg-purple-600 hover:bg-purple-500 border-none px-4 py-2"
                >
                  {savingAi ? t("status.saving", "Saving...") : t("actions.save", "Save AI Configuration")}
                </button>
              </div>
            </form>
          </div>

          {/* Right Panel: Live Test Simulator */}
          <div className="card p-6 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-brand-400" />
                Prompt Simulator
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Test how the AI assistant replies before publishing to customers.
              </p>

              <div className="mt-4 space-y-3">
                <input
                  type="text"
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  placeholder="Type a sample customer question..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />

                <button
                  type="button"
                  onClick={handleTestAi}
                  disabled={testingAi || !testInput.trim()}
                  className="w-full btn-secondary text-xs flex items-center justify-center gap-2"
                >
                  <Send className={`w-3.5 h-3.5 ${testingAi ? "animate-spin" : ""}`} />
                  <span>{testingAi ? "Generating..." : "Simulate Response"}</span>
                </button>
              </div>

              {testReply && (
                <div className="mt-4 p-3 rounded-xl bg-gray-800/70 border border-gray-700/60 text-xs space-y-1">
                  <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                    AI Response:
                  </p>
                  <p className="text-gray-200 whitespace-pre-wrap leading-relaxed">
                    {testReply}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
