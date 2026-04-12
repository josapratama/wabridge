import { useEffect, useState } from "react";
import { eventsApi, ProviderEvent } from "../../api/client";
import StatusBadge from "../../components/StatusBadge";
import EmptyState from "../../components/EmptyState";
import { Activity, RefreshCw, ChevronDown, ChevronRight } from "lucide-react";

function EventRow({ event }: { event: ProviderEvent }) {
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
            {event.processed ? "processed" : "pending"}
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
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Events</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            All provider events log — click a row to inspect payload
          </p>
        </div>
        <button
          onClick={() => void load()}
          className="btn-secondary"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filter */}
      <input
        className="input max-w-xs"
        placeholder="Filter by event type or provider…"
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
            title="No events"
            description="Events are recorded when webhooks arrive or messages are sent."
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-5 py-3 w-8" />
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  Provider
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  Event Type
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  Session
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  State
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  Time
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <EventRow key={e.id} event={e} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-gray-600 text-right">
          Showing {filtered.length} of {events.length} events
        </p>
      )}
    </div>
  );
}
