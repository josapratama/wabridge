import { useState, useEffect } from "react";
import { AutoReplyRule, aiBotApi, AiBotConfig } from "../../api/client";
import EmptyState from "../../components/EmptyState";
import {
  Bot,
  Plus,
  RefreshCw,
  Trash2,
  Sparkles,
  Key,
  ShieldCheck,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import {
  useAutoReply,
  RuleForm,
} from "../../features/auto-reply/hooks/useAutoReply";
import AutoReplyForm from "../../features/auto-reply/components/AutoReplyForm";
import AutoReplyTable from "../../features/auto-reply/components/AutoReplyTable";

export default function AutoReply() {
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
        setAiSaveMsg("AI Bot configuration saved successfully!");
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
    } catch (err: unknown) {
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
              <Plus className="w-4 h-4" /> New Rule
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
              title="No auto-reply rules"
              description="Create rules to automatically reply when inbound messages match specific keywords."
              action={
                <button onClick={openCreate} className="btn-primary">
                  <Plus className="w-4 h-4" /> Create Rule
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
                <h3 className="text-base font-bold text-white">Delete Rule</h3>
                <p className="text-sm text-gray-400">
                  Are you sure you want to delete this auto-reply rule?
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setDeleteId(null)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => void handleDelete(deleteId)}
                    className="btn-danger"
                  >
                    Delete
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
                    System Prompt (Persona & Gaya Bahasa)
                  </label>
                  <span className="text-[10px] text-gray-500">
                    Karakter & aturan bicara bot
                  </span>
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
                  placeholder="Contoh: Anda adalah customer support WhatsApp yang ramah dan solutif..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 font-sans leading-relaxed"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-gray-300">
                    Knowledge Base Bisnis & FAQ Produk
                  </label>
                  <span className="text-[10px] text-gray-500">
                    Data produk, harga, & info toko
                  </span>
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
                  placeholder="Masukkan daftar produk, harga, jam operasional, no rekening, atau FAQ yang ingin dijawab oleh AI..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 font-sans leading-relaxed"
                />
              </div>

              <div className="space-y-3 p-3 bg-gray-800/40 border border-gray-700/60 rounded-xl">
                <div>
                  <label className="block text-xs font-medium text-purple-300 mb-1">
                    Human Agent Handover Keywords
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
                        handoverKeywords: e.target.value as any,
                      }))
                    }
                    placeholder="cs, admin, human, manusia, bantuan"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Jika pelanggan mengetik kata di atas, bot akan otomatis berhenti selama 2 jam dan mengalihkan chat ke CS manusia.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-purple-300 mb-1">
                    Pesan Alihkan ke CS
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
                    placeholder="Pesan Anda telah diteruskan ke Customer Service manusia. Mohon ditunggu ya kak."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
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
                  {savingAi ? "Saving..." : "Save AI Configuration"}
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

            <div className="p-3 rounded-lg bg-gray-800/40 text-[11px] text-gray-400 border border-gray-800">
              💡 <span className="font-semibold text-gray-300">Tip:</span> Ensure you have saved your API key and enabled the switch above to activate automatic AI responses.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
