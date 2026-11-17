import { useEffect, useState } from "react";
import { eventsApi, ProviderEvent } from "../../api/client";
import StatusBadge from "../../components/StatusBadge";
import EmptyState from "../../components/EmptyState";
import { Activity, RefreshCw, ChevronDown, ChevronRight } from "lucide-react";
import { useI18n } from "../../context/I18nContext";

function MobileEventCard({ event }: { event: ProviderEvent }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <div
      onClick={() => setOpen((o) => !o)}
      className="p-3.5 space-y-2 cursor-pointer hover:bg-gray-850/60 active:bg-gray-800/80 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusBadge value={event.providerType} />
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-medium ${
              event.processed ? "text-brand-400" : "text-yellow-400"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                event.processed ? "bg-brand-400" : "bg-yellow-400"
              }`}
            />
            {event.processed
              ? t("events.processed", "Diproses")
              : t("events.pending", "Menunggu")}
          </span>
        </div>
        <span className="text-[10px] text-gray-500">
          {new Date(event.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-gray-100 bg-gray-800/80 px-2 py-0.5 rounded border border-gray-700/50">
          {event.eventType}
        </span>
        <div className="flex items-center gap-1.5 text-gray-400 text-xs">
          <span className="text-[11px] text-gray-500 font-mono">
            {event.sessionId ? event.sessionId.slice(0, 8) + "…" : "—"}
          </span>
          {open ? (
            <ChevronDown className="w-3.5 h-3.5 text-brand-400" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
          )}
        </div>
      </div>

      {open && (
        <div className="pt-1.5 animate-in fade-in duration-150" onClick={(e) => e.stopPropagation()}>
          <pre className="text-[10px] leading-relaxed text-gray-300 bg-gray-950 rounded-lg p-2.5 overflow-x-auto max-h-48 border border-gray-800 font-mono">
            {JSON.stringify(event.payload, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function EventRow({ event }: { event: ProviderEvent }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      <tr
        className="table-row cursor-pointer select-none"
        onClick={() => setOpen((o) => !o)}
      >
        <td className="px-5 py-3">
          {open ? (
            <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
          )}
        </td>
        <td className="px-5 py-3">
          <StatusBadge value={event.providerType} />
        </td>
        <td className="px-5 py-3 font-mono text-xs text-gray-200">
          {event.eventType}
        </td>
        <td className="px-5 py-3 text-gray-500 text-xs font-mono">
          {event.sessionId ? event.sessionId.slice(0, 8) + "…" : "—"}
        </td>
        <td className="px-5 py-3">
          <span
            className={`inline-flex items-center gap-1.5 text-xs ${event.processed ? "text-brand-400" : "text-yellow-400"}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${event.processed ? "bg-brand-400" : "bg-yellow-400"}`}
            />
            {event.processed
              ? t("events.processed", "Diproses")
              : t("events.pending", "Menunggu")}
          </span>
        </td>
        <td className="px-5 py-3 text-gray-500 text-xs">
          {new Date(event.createdAt).toLocaleString()}
        </td>
      </tr>
      {open && (
        <tr className="bg-gray-950/50">
          <td colSpan={6} className="px-5 py-3">
            <pre className="text-xs text-gray-400 bg-gray-900 rounded-lg p-3 overflow-x-auto max-h-48">
              {JSON.stringify(event.payload, null, 2)}
            </pre>
          </td>
        </tr>
      )}
    </>
  );
}

export default function Events() {
  const { t } = useI18n();
  const [events, setEvents] = useState<ProviderEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const load = async () => {
    setLoading(true);
    const res = await eventsApi.list();
    if (res.data) setEvents([...res.data].reverse());
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = filter
    ? events.filter(
        (e) => e.eventType.includes(filter) || e.providerType.includes(filter),
      )
    : events;

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-xs sm:text-sm text-gray-400">
          {t("events.subtitle", "Pantau riwayat event gateway WhatsApp seperti koneksi, pesan masuk, dan webhook")}
        </p>
        <button
          onClick={() => void load()}
          className="btn-secondary self-start sm:self-auto text-xs sm:text-sm"
          disabled={loading}
        >
          <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${loading ? "animate-spin" : ""}`} />
          {t("common.refresh", "Refresh")}
        </button>
      </div>

      {/* Filter */}
      <input
        className="input w-full sm:max-w-xs text-xs sm:text-sm"
        placeholder={t("events.filter_placeholder", "Cari berdasarkan tipe event atau provider…")}
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-5 h-5 text-gray-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Activity}
            title={t("events.empty", "Belum ada event tercatat")}
            description={t("events.subtitle", "Pantau riwayat event gateway WhatsApp seperti koneksi, pesan masuk, dan webhook")}
          />
        ) : (
          <>
            {/* Mobile Cards View */}
            <div className="sm:hidden divide-y divide-gray-800">
              {filtered.map((e) => (
                <MobileEventCard key={e.id} event={e} />
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="px-5 py-3 w-8" />
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                      {t("events.provider", "Provider")}
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                      {t("events.event_type", "Tipe Event")}
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                      {t("events.session", "Sesi")}
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                      {t("events.status", "Status")}
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                      {t("events.timestamp", "Waktu")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e) => (
                    <EventRow key={e.id} event={e} />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-gray-600 text-right">
          {filtered.length} / {events.length} {t("nav.events", "Events").toLowerCase()}
        </p>
      )}
    </div>
  );
}
