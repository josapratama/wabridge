import { useState } from "react";
import EmptyState from "../../components/EmptyState";
import { Radio, Plus, RefreshCw } from "lucide-react";
import { useBroadcast } from "../../features/broadcast/hooks/useBroadcast";
import BroadcastForm from "../../features/broadcast/components/BroadcastForm";
import BroadcastTable from "../../features/broadcast/components/BroadcastTable";

export default function Broadcast() {
  const { jobs, sessions, contacts, loading, load, create, cancel, allTags } =
    useBroadcast();
  const [showForm, setShowForm] = useState(false);

  const handleCreate = async (params: {
    name: string;
    sessionId: string;
    content: string;
    recipients: string[];
    delayMs: number;
  }) => {
    const res = await create(params);
    if (res.success) setShowForm(false);
    return res;
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-brand-400" />
            Broadcast
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Send messages to multiple recipients
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void load()}
            className="btn-secondary"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> New Broadcast
          </button>
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <BroadcastForm
          sessions={sessions}
          contacts={contacts}
          allTags={allTags}
          onSubmit={handleCreate}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-5 h-5 text-gray-500 animate-spin" />
          </div>
        ) : jobs.length === 0 ? (
          <EmptyState
            icon={Radio}
            title="No broadcasts"
            description="Create a broadcast to send messages to multiple recipients."
            action={
              <button className="btn-primary" onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4" /> New Broadcast
              </button>
            }
          />
        ) : (
          <BroadcastTable jobs={jobs} onCancel={(id) => void cancel(id)} />
        )}
      </div>
    </div>
  );
}
