import { useState } from "react";
import { ProviderConfig } from "../../../api/client";
import { X, Check, RefreshCw, Smartphone, HelpCircle } from "lucide-react";

const EMPTY: Partial<ProviderConfig> = {
  providerType: "meta-cloud",
  name: "",
  accessToken: "",
  phoneNumberId: "",
  apiVersion: "v19.0",
  verifyToken: "",
  baseUrl: "",
};

interface Props {
  onSubmit: (
    form: Partial<ProviderConfig>,
  ) => Promise<{ success: boolean; message: string }>;
  onClose: () => void;
}

export default function ProviderConfigForm({ onSubmit, onClose }: Props) {
  const [form, setForm] = useState<Partial<ProviderConfig>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await onSubmit(form);
    if (!res.success) setError(res.message);
    setSaving(false);
  };

  const isBaileys = form.providerType === "baileys";
  const isMeta = form.providerType === "meta-cloud";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="card w-full max-w-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">
            New Provider Config
          </h2>
          <div className="flex items-center gap-2">
            <a
              href="https://developers.facebook.com/docs/whatsapp"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-300 transition-colors"
              title="Documentation"
            >
              <HelpCircle className="w-5 h-5" />
            </a>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {error && (
          <div className="px-3 py-2 bg-red-900/30 border border-red-800/50 rounded-lg text-sm text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
          {/* Type + Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Provider Type</label>
              <select
                className="input"
                value={form.providerType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    providerType: e.target
                      .value as ProviderConfig["providerType"],
                  })
                }
              >
                <option value="meta-cloud">Meta Cloud API</option>
                <option value="bsp">BSP / Partner</option>
                <option value="baileys">Baileys (WhatsApp Web)</option>
              </select>
            </div>
            <div>
              <label className="label">Name *</label>
              <input
                className="input"
                placeholder="e.g. Production Meta"
                required
                minLength={3}
                value={form.name ?? ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
          </div>

          {/* Access Token */}
          <div>
            <label className="label">Access Token {!isBaileys && "*"}</label>
            <input
              className="input"
              type="password"
              required={!isBaileys}
              disabled={isBaileys}
              placeholder={
                isBaileys
                  ? "Not required for Baileys"
                  : isMeta
                    ? "EAAxxxxx... (from Meta for Developers)"
                    : "API Key from your BSP provider"
              }
              value={form.accessToken ?? ""}
              onChange={(e) =>
                setForm({ ...form, accessToken: e.target.value })
              }
            />
            {isMeta && (
              <p className="text-xs text-gray-500 mt-1">
                Get from: Meta for Developers → Your App → WhatsApp → Getting
                Started
              </p>
            )}
            {form.providerType === "bsp" && (
              <p className="text-xs text-gray-500 mt-1">
                Get from your BSP provider dashboard (Twilio, MessageBird, etc.)
              </p>
            )}
          </div>

          {/* Provider-specific fields */}
          {isBaileys ? (
            <div className="px-4 py-3 bg-blue-900/20 border border-blue-800/30 rounded-lg flex gap-3">
              <Smartphone className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-blue-300 font-medium mb-1">
                  WhatsApp Web Connection
                </p>
                <p className="text-blue-400/80 text-xs leading-relaxed">
                  After creating this config, activate it to generate a QR code.
                  Scan with your WhatsApp mobile app.
                </p>
              </div>
            </div>
          ) : isMeta ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Phone Number ID</label>
                <input
                  className="input"
                  placeholder="1234567890"
                  value={form.phoneNumberId ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, phoneNumberId: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">API Version</label>
                <input
                  className="input"
                  placeholder="v19.0"
                  value={form.apiVersion ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, apiVersion: e.target.value })
                  }
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="label">Base URL</label>
              <input
                className="input"
                placeholder="https://api.bsp-provider.com/v1"
                value={form.baseUrl ?? ""}
                onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
              />
            </div>
          )}

          {/* Verify Token */}
          <div>
            <label className="label">Verify Token</label>
            <input
              className="input"
              disabled={isBaileys}
              placeholder={
                isBaileys
                  ? "Not required for Baileys"
                  : "Create your own random string (e.g., my_token_123)"
              }
              value={form.verifyToken ?? ""}
              onChange={(e) =>
                setForm({ ...form, verifyToken: e.target.value })
              }
            />
            {!isBaileys && (
              <p className="text-xs text-gray-500 mt-1">
                Create a random string. You'll use this when setting up
                webhooks.
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={saving}
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {saving ? "Saving…" : "Create Config"}
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
