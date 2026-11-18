import { useState, useEffect } from "react";
import {
  X,
  QrCode,
  Smartphone,
  AlertCircle,
  RefreshCw,
  Check,
  Loader2,
} from "lucide-react";
import { useI18n } from "../context/I18nContext";

interface Props {
  show: boolean;
  configId: string;
  onClose: () => void;
  onRequestQrCode: () => Promise<void>;
  onRequestPairingCode: (phoneNumber: string) => Promise<void>;
  qrCode: string | null;
  pairingCode: string | null;
  loading: boolean;
  pairingLoading?: boolean;
  isConnected?: boolean;
}

export default function BaileysConnectionModal({
  show,
  configId,
  onClose,
  onRequestQrCode,
  onRequestPairingCode,
  qrCode,
  pairingCode,
  loading,
  pairingLoading = false,
  isConnected = false,
}: Props) {
  const { t } = useI18n();
  const [mode, setMode] = useState<"qr" | "pairing">("qr");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    if (show && mode === "qr" && !qrCode && !loading) {
      void onRequestQrCode();
    }
  }, [show, mode]);

  useEffect(() => {
    if (!show || mode !== "qr" || !qrCode) {
      setTimeLeft(60);
      return;
    }

    setTimeLeft(60);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          void onRequestQrCode();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [show, mode, qrCode]);

  if (!show) return null;

  const handleRequestPairingCode = async () => {
    setError("");
    if (!phoneNumber || phoneNumber.length < 10) {
      setError(t("sessions.error_phone", "Enter a valid phone number with country code"));
      return;
    }
    try {
      await onRequestPairingCode(phoneNumber);
    } catch {
      setError(t("sessions.error_pairing", "Failed to generate pairing code. Please try again."));
    }
  };

  const handleRequestQrCode = async () => {
    setError("");
    try {
      await onRequestQrCode();
    } catch {
      setError(t("sessions.error_qr", "Failed to generate QR code. Please try again."));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="card w-full max-w-sm flex flex-col overflow-hidden max-h-[90vh] shadow-2xl border-gray-750">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <QrCode className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-none">
                {t("sessions.scan_qr", "Connect WhatsApp")}
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                {t("sessions.scan_qr_desc", "Scan QR or use pairing code")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800 bg-gray-900/50">
          <button
            onClick={() => {
              setMode("qr");
              setError("");
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold transition-colors border-b-2 ${
              mode === "qr"
                ? "border-emerald-500 text-emerald-400 bg-emerald-950/20"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            {t("provider_configs.qr_code", "QR Code")}
          </button>
          <button
            onClick={() => {
              setMode("pairing");
              setError("");
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold transition-colors border-b-2 ${
              mode === "pairing"
                ? "border-emerald-500 text-emerald-400 bg-emerald-950/20"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            {t("sessions.pairing_code", "Pairing Code")}
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-900/30 border border-red-800/50 rounded-lg">
              <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          {/* ── QR Mode ── */}
          {mode === "qr" && (
            <div className="space-y-4">
              {/* QR display area */}
              <div className="rounded-xl border border-gray-800 bg-gray-950 overflow-hidden">
                {isConnected ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 gap-2.5 text-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                      <Check className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-emerald-300">
                      {t("sessions.already_connected", "WhatsApp Sudah Terhubung!")}
                    </p>
                    <p className="text-xs text-gray-400 max-w-xs">
                      {t("sessions.already_connected_desc", "Perangkat Anda sudah terautentikasi dan sesi aktif. Anda tidak perlu scan barcode lagi.")}
                    </p>
                  </div>
                ) : qrCode ? (
                  <div className="p-4 bg-white flex items-center justify-center">
                    <img
                      src={qrCode}
                      alt="QR Code"
                      className="w-48 h-48 object-contain block"
                    />
                  </div>
                ) : loading ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                    <p className="text-xs text-gray-400">{t("actions.loading", "Generating QR code…")}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <QrCode className="w-10 h-10 text-gray-600" />
                    <p className="text-xs text-gray-400">
                      {t("sessions.click_generate", "Click below to generate")}
                    </p>
                  </div>
                )}
              </div>

              {qrCode && (
                <div className="space-y-2">
                  <div className="p-3 bg-gray-900/80 border border-gray-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-gray-300 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        {t("sessions.auto_refresh", "Auto-refresh QR aktif")}
                      </span>
                      <span className="font-mono text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                        {timeLeft}s
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-1.5 rounded-full transition-all duration-1000 ease-linear shadow-sm shadow-emerald-500/50"
                        style={{ width: `${(timeLeft / 60) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-start gap-2 px-3 py-2 bg-yellow-900/20 border border-yellow-800/30 rounded-lg">
                    <AlertCircle className="w-3.5 h-3.5 text-yellow-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-yellow-400/80">
                      {t("sessions.qr_expires", "QR code kedaluwarsa dalam 60 detik. Sistem otomatis memperbarui.")}
                    </p>
                  </div>
                </div>
              )}

              {/* Steps */}
              <div className="space-y-2">
                {[
                  t("sessions.step_1", "Open WhatsApp on your phone"),
                  t("sessions.step_2", "Tap Menu (Android) or Settings (iOS) → Linked Devices"),
                  t("sessions.step_3", "Tap Link a Device and scan this code"),
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-600/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <p className="text-xs text-gray-400">{step}</p>
                  </div>
                ))}
              </div>

              {!qrCode && (
                <button
                  onClick={() => void handleRequestQrCode()}
                  disabled={loading}
                  className="btn-primary w-full justify-center py-2.5 shadow-lg shadow-brand-500/20"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <QrCode className="w-4 h-4" />
                  )}
                  {loading ? t("actions.saving", "Generating…") : t("sessions.generate_qr", "Generate QR Code")}
                </button>
              )}

              {qrCode && (
                <button
                  onClick={() => void handleRequestQrCode()}
                  disabled={loading}
                  className="btn-secondary w-full justify-center py-2.5"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                  />
                  {t("actions.refresh", "Refresh QR")}
                </button>
              )}
            </div>
          )}

          {/* ── Pairing Mode ── */}
          {mode === "pairing" && (
            <div className="space-y-4">
              {!pairingCode ? (
                <>
                  <div className="rounded-xl border border-gray-800 bg-gray-950 p-5 space-y-3">
                    <div className="flex flex-col items-center gap-2 pb-2">
                      <Smartphone className="w-8 h-8 text-emerald-400" />
                      <p className="text-xs text-gray-400 text-center">
                        {t("sessions.enter_phone", "Enter your WhatsApp number with country code")}
                      </p>
                    </div>
                    <input
                      type="tel"
                      placeholder="628123456789"
                      className="input text-center text-base tracking-widest font-mono"
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value);
                        setError("");
                      }}
                    />
                    <p className="text-[10px] text-gray-500 text-center">
                      No + or spaces · e.g. 628123456789
                    </p>
                  </div>

                  <button
                    onClick={() => void handleRequestPairingCode()}
                    disabled={!phoneNumber || pairingLoading}
                    className="btn-primary w-full justify-center py-2.5 shadow-lg shadow-brand-500/20"
                  >
                    {pairingLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    {pairingLoading ? t("actions.saving", "Generating…") : t("sessions.get_pairing_code", "Get Pairing Code")}
                  </button>
                </>
              ) : (
                <div className="space-y-4">
                  {/* Code display */}
                  <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/20 p-5 text-center space-y-2">
                    <p className="text-xs text-gray-400">{t("sessions.your_pairing_code", "Your pairing code")}</p>
                    <div className="text-3xl font-bold text-white tracking-[0.4em] font-mono py-2">
                      {pairingCode}
                    </div>
                    <p className="text-[10px] text-gray-500">
                      {t("sessions.valid_seconds", "Valid for ~60 seconds")}
                    </p>
                  </div>

                  {/* Steps */}
                  <div className="space-y-2">
                    {[
                      t("sessions.pair_step_1", "Open WhatsApp on your phone"),
                      t("sessions.pair_step_2", "Go to Settings → Linked Devices → Link a Device"),
                      t("sessions.pair_step_3", "Tap Link with phone number instead"),
                      t("sessions.pair_step_4", "Enter the code above within 60 seconds"),
                    ].map((step, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-emerald-600/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <p className="text-xs text-gray-400">{step}</p>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      setPhoneNumber("");
                      setError("");
                    }}
                    className="btn-secondary w-full justify-center text-xs py-2.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    {t("sessions.request_new_code", "Request New Code")}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="btn-secondary w-full justify-center py-2.5"
          >
            {t("actions.close", "Close")}
          </button>
        </div>
      </div>
    </div>
  );
}