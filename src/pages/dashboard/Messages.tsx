import { useState } from "react";
import EmptyState from "../../components/EmptyState";
import { MessageSquare, Send, RefreshCw, Download } from "lucide-react";
import { useMessages } from "../../features/messages/hooks/useMessages";
import { SendForm } from "../../features/messages/constants";
import MessageFilters from "../../features/messages/components/MessageFilters";
import MessageSendForm from "../../features/messages/components/MessageSendForm";
import MessageTable from "../../features/messages/components/MessageTable";
import { useI18n } from "../../context/I18nContext";

export default function Messages() {
  const { t } = useI18n();
  const { messages, sessions, loading, load, send, exportMessages, filter } =
    useMessages();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDirection, setFilterDirection] = useState("");

  const filtered = filter(messages, search, filterStatus, filterDirection);
  const hasFilters = !!(search || filterStatus || filterDirection);

  const handleSend = async (form: SendForm) => {
    const res = await send(form);
    if (res.success) setShowForm(false);
    return res;
  };

  return (
    <div className="p-6 space-y-5">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-gray-400">
          {t("table.showing", "Showing")} <span className="font-semibold text-gray-200">{filtered.length}</span> {t("messages.title", "messages")}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void load()}
            className="btn-secondary"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <div className="relative group">
            <button className="btn-secondary">
              <Download className="w-4 h-4" /> {t("actions.export", "Export")}
            </button>
            <div className="absolute right-0 top-full mt-1 w-32 card py-1 hidden group-hover:block z-10">
              <button
                onClick={() =>
                  exportMessages("csv", {
                    status: filterStatus,
                    direction: filterDirection,
                  })
                }
                className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-800"
              >
                CSV
              </button>
              <button
                onClick={() =>
                  exportMessages("json", {
                    status: filterStatus,
                    direction: filterDirection,
                  })
                }
                className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-800"
              >
                JSON
              </button>
            </div>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Send className="w-4 h-4" /> {t("messages.send_new", "Send Message")}
          </button>
        </div>
      </div>

      {/* Filters */}
      <MessageFilters
        search={search}
        status={filterStatus}
        direction={filterDirection}
        onSearch={setSearch}
        onStatus={setFilterStatus}
        onDirection={setFilterDirection}
      />

      {/* Send modal */}
      {showForm && (
        <MessageSendForm
          sessions={sessions}
          onSend={handleSend}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-5 h-5 text-gray-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title={t("messages.empty", "No messages")}
            description={
              hasFilters
                ? t("table.no_data", "No messages match your filters.")
                : t("messages.subtitle", "Send your first message or wait for inbound messages.")
            }
            action={
              !hasFilters ? (
                <button
                  className="btn-primary"
                  onClick={() => setShowForm(true)}
                >
                  <Send className="w-4 h-4" /> {t("messages.send_new", "Send Message")}
                </button>
              ) : undefined
            }
          />
        ) : (
          <MessageTable messages={filtered} />
        )}
      </div>
    </div>
  );
}
