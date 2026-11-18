import { useState, useMemo } from "react";
import EmptyState from "../../components/EmptyState";
import TablePagination from "../../components/TablePagination";
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filtered = useMemo(() => {
    return filter(messages, search, filterStatus, filterDirection);
  }, [messages, search, filterStatus, filterDirection, filter]);

  const hasFilters = !!(search || filterStatus || filterDirection);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedMessages = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const handleSend = async (form: SendForm) => {
    const res = await send(form);
    if (res.success) setShowForm(false);
    return res;
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  const handleStatusChange = (val: string) => {
    setFilterStatus(val);
    setCurrentPage(1);
  };

  const handleDirectionChange = (val: string) => {
    setFilterDirection(val);
    setCurrentPage(1);
  };

  return (
    <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-5">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            {t("messages.title", "Log Pesan WhatsApp")}
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
            {t("table.showing", "Menampilkan")}{" "}
            <span className="font-semibold text-gray-200">{filtered.length}</span>{" "}
            {t("messages.title_count", "pesan yang tercatat")}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => void load()}
            className="btn-secondary text-xs sm:text-sm"
            disabled={loading}
            title={t("actions.refresh", "Refresh")}
          >
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <div className="relative group">
            <button className="btn-secondary text-xs sm:text-sm">
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {t("actions.export", "Ekspor")}
            </button>
            <div className="absolute right-0 top-full mt-1 w-32 card py-1 hidden group-hover:block z-10 shadow-xl">
              <button
                onClick={() =>
                  exportMessages("csv", {
                    status: filterStatus,
                    direction: filterDirection,
                  })
                }
                className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-800"
              >
                CSV (.csv)
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
                JSON (.json)
              </button>
            </div>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary text-xs sm:text-sm shadow-lg shadow-brand-500/20">
            <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {t("messages.send_new", "Kirim Pesan")}
          </button>
        </div>
      </div>

      {/* Filters */}
      <MessageFilters
        search={search}
        status={filterStatus}
        direction={filterDirection}
        onSearch={handleSearchChange}
        onStatus={handleStatusChange}
        onDirection={handleDirectionChange}
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
            title={t("messages.empty", "Belum Ada Pesan")}
            description={
              hasFilters
                ? t("table.no_data", "Tidak ada pesan yang cocok dengan filter Anda.")
                : t("messages.subtitle", "Kirim pesan pertama Anda atau tunggu pesan masuk dari WhatsApp.")
            }
            action={
              !hasFilters ? (
                <button
                  className="btn-primary shadow-lg shadow-brand-500/20"
                  onClick={() => setShowForm(true)}
                >
                  <Send className="w-4 h-4" /> {t("messages.send_new", "Kirim Pesan Baru")}
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            <MessageTable messages={paginatedMessages} />
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filtered.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(num) => {
                setItemsPerPage(num);
                setCurrentPage(1);
              }}
              itemsPerPageOptions={[5, 10, 25, 50]}
            />
          </>
        )}
      </div>
    </div>
  );
}
