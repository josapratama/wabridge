import { useState } from "react";
import { AutoReplyRule } from "../../api/client";
import EmptyState from "../../components/EmptyState";
import { Bot, Plus, RefreshCw, Sparkles } from "lucide-react";
import {
  useAutoReply,
  RuleForm,
} from "../../features/auto-reply/hooks/useAutoReply";
import AutoReplyForm from "../../features/auto-reply/components/AutoReplyForm";
import AutoReplyTable from "../../features/auto-reply/components/AutoReplyTable";
import AiBotProfilesView from "../../features/auto-reply/components/AiBotProfilesView";
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
    if (editing) {
      const res = await update(editing.id, form);
      closeForm();
      return res;
    } else {
      const res = await create(form);
      closeForm();
      return res;
    }
  };

  const handleDelete = async (id: string) => {
    await remove(id);
    setDeleteId(null);
  };

  return (
    <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-5">
      {/* Page Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-xs sm:text-sm text-gray-400">
          {t(
            "autoreply.page_subtitle",
            "Kelola aturan balasan otomatis berbasis kata kunci serta profil kecerdasan buatan (LLM) untuk nomor WhatsApp Anda."
          )}
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("rules")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "rules"
                ? "bg-brand-600/20 text-brand-400 border border-brand-500/40 shadow-sm"
                : "text-gray-400 hover:text-white hover:bg-gray-850/60"
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>
              {t("autoreply.rules_tab", "Aturan Kata Kunci")} ({rules.length})
            </span>
          </button>
          <button
            onClick={() => setActiveTab("ai")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "ai"
                ? "bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-sm"
                : "text-gray-400 hover:text-white hover:bg-gray-850/60"
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>{t("autoreply.ai_tab", "Profil AI Bot Assistant")}</span>
          </button>
        </div>

        {/* Right Actions for Keyword Rules */}
        {activeTab === "rules" && (
          <div className="flex gap-2 self-start sm:self-auto">
            <button
              onClick={() => void load()}
              className="btn-secondary text-xs sm:text-sm"
              disabled={loading}
              title={t("actions.refresh", "Refresh")}
            >
              <RefreshCw
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${loading ? "animate-spin" : ""}`}
              />
            </button>
            <button
              onClick={openCreate}
              className="btn-primary text-xs sm:text-sm shadow-lg shadow-brand-500/20"
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
                "Buat aturan pesan otomatis berdasarkan kecocokan kata kunci dari pengirim WhatsApp."
              )}
              action={
                <button
                  onClick={openCreate}
                  className="btn-primary text-xs shadow-lg shadow-brand-500/20"
                >
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
                  {t(
                    "confirm.delete_desc",
                    "Apakah Anda yakin ingin menghapus aturan pesan otomatis ini?"
                  )}
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

      {/* Tab 2: Multi-Profile AI Assistant Bot Settings */}
      {activeTab === "ai" && <AiBotProfilesView sessions={sessions} />}
    </div>
  );
}
