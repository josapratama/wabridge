import { useState } from "react";
import { ProviderConfig } from "../../../api/client";
import { X, Check, RefreshCw, Smartphone, HelpCircle } from "lucide-react";
import { useI18n } from "../../../context/I18nContext";

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
  const { t } = useI18n();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="card w-full max-w-lg p-6 space-y-5 border border-gray-750 shadow-2xl my-8">
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div>
            <h2 className="text-base font-semibold text-white">
              {t("provider_configs.form_title", "New Provider Config")}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {t("provider_configs.form_desc", "Configure your WhatsApp integration credentials")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://developers.facebook.com/docs/whatsapp"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors p-1"
              title={t("provider_configs.docs_link", "Documentation")}
            >
              <HelpCircle className="w-5 h-5" />
            </a>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {error && (
          <div className="px-3.5 py-2.5 bg-red-900/30 border border-red-800/50 rounded-lg text-sm text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          {/* Type + Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">
                {t("provider_configs.provider_type", "Provider Type")}
              </label>
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
              <label className="label">
                {t("provider_configs.name", "Name")} *
              </label>
              <input
                className="input"
                placeholder={t("provider_configs.name_placeholder", "e.g. Production Meta")}
                required
                minLength={3}
                value={form.name ?? ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
          </div>

          {/* Access Token */}
          <div>
            <label className="label">
              {t("provider_configs.access_token", "Access Token")} {!isBaileys && "*"}
            </label>
            <input
              className="input"
              type="password"
              required={!isBaileys}
              disabled={isBaileys}
              placeholder={
                isBaileys
                  ? t("provider_configs.token_not_required", "Not required for Baileys")
                  : isMeta
                    ? "EAAxxxxx... (from Meta for Developers)"
                    : t("provider_configs.token_bsp_placeholder", "API Key from your BSP provider")
              }
              value={form.accessToken ?? ""}
              onChange={(e) =>
                setForm({ ...form, accessToken: e.target.value })
              }
            />
            {isMeta && (
              <p className="text-xs text-gray-500 mt-1.5">
                Meta for Developers → Your App → WhatsApp → Getting Started
              </p>
            )}
            {form.providerType === "bsp" && (
              <p className="text-xs text-gray-500 mt-1.5">
                Get from your BSP provider dashboard (Twilio, MessageBird, etc.)
              </p>
            )}
          </div>

          {/* Provider-specific fields */}
          {isBaileys ? (
            <div className="px-4 py-3 bg-emerald-950/20 border border-emerald-800/30 rounded-xl flex gap-3 items-start">
              <Smartphone className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-emerald-300 font-semibold mb-0.5">
                  {t("provider_configs.baileys_title", "WhatsApp Web Connection")}
                </p>
                <p className="text-emerald-400/80 text-xs leading-relaxed">
                  {t(
                    "provider_configs.baileys_desc",
                    "After creating this config, activate it to generate a QR code. Scan with your WhatsApp mobile app.",
                  )}
                </p>
              </div>
            </div>
          ) : isMeta ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">
                  {t("provider_configs.phone_number_id", "Phone Number ID")}
                </label>
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
                <label className="label">
                  {t("provider_configs.api_version", "API Version")}
                </label>
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
              <label className="label">
                {t("provider_configs.base_url", "Base URL")}
              </label>
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
            <label className="label">
              {t("provider_configs.verify_token", "Verify Token")}
            </label>
            <input
              className="input"
              disabled={isBaileys}
              placeholder={
                isBaileys
                  ? t("provider_configs.token_not_required", "Not required for Baileys")
                  : "e.g. my_verify_token_123"
              }
              value={form.verifyToken ?? ""}
              onChange={(e) =>
                setForm({ ...form, verifyToken: e.target.value })
              }
            />
            {!isBaileys && (
              <p className="text-xs text-gray-500 mt-1.5">
                {t("provider_configs.verify_token_help", "Create a random string. You'll use this when setting up webhooks.")}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="btn-primary flex-1 justify-center py-2.5 shadow-lg shadow-brand-500/20"
              disabled={saving}
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {saving ? t("actions.saving", "Saving…") : t("provider_configs.create_btn", "Create Config")}
            </button>
            <button type="button" className="btn-secondary py-2.5 px-4" onClick={onClose}>
              {t("actions.cancel", "Cancel")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
