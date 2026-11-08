import { useEffect, useState } from "react";
import { ipWhitelistApi, IpWhitelist } from "../../../api/client";
import { Plus, RefreshCw, Trash2 } from "lucide-react";

interface Props {
  apiKeyId: string;
}

export default function IpWhitelistPanel({ apiKeyId }: Props) {
  const [ips, setIps] = useState<IpWhitelist[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ cidr: "", label: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await ipWhitelistApi.list(apiKeyId);
    if (res.data) setIps(res.data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [apiKeyId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await ipWhitelistApi.add(apiKeyId, form.cidr, form.label || undefined);
    setForm({ cidr: "", label: "" });
    await load();
    setSaving(false);
  };

  const handleRemove = async (id: string) => {
    await ipWhitelistApi.remove(apiKeyId, id);
    await load();
  };

  return (
    <div className="px-5 pb-4 space-y-3 bg-gray-950/50 border-t border-gray-800">
      <p className="text-xs text-gray-500 pt-3">
        {ips.length === 0
          ? "No IP restrictions — all IPs allowed."
          : `${ips.length} IP rule(s) — only listed IPs can use this key.`}
      </p>

      {loading ? (
        <RefreshCw className="w-3.5 h-3.5 text-gray-600 animate-spin" />
      ) : (
        <div className="space-y-1.5">
          {ips.map((ip) => (
            <div
              key={ip.id}
              className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-1.5"
            >
              <code className="text-xs text-brand-400 font-mono flex-1">
                {ip.cidr}
              </code>
              {ip.label && (
                <span className="text-xs text-gray-500">{ip.label}</span>
              )}
              <button
                onClick={() => void handleRemove(ip.id)}
                className="text-gray-600 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={(e) => void handleAdd(e)} className="flex gap-2">
        <input
          className="input text-xs flex-1"
          placeholder="192.168.1.0/24 or 1.2.3.4/32"
          required
          value={form.cidr}
          onChange={(e) => setForm({ ...form, cidr: e.target.value })}
        />
        <input
          className="input text-xs w-28"
          placeholder="Label (opt)"
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
        />
        <button
          type="submit"
          className="btn-secondary text-xs shrink-0"
          disabled={saving}
        >
          {saving ? (
            <RefreshCw className="w-3 h-3 animate-spin" />
          ) : (
            <Plus className="w-3 h-3" />
          )}
          Add
        </button>
      </form>
    </div>
  );
}
