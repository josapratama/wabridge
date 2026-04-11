import { useState } from "react";
import {
  X,
  QrCode,
  Smartphone,
  AlertCircle,
  RefreshCw,
  Check,
  Loader2,
} from "lucide-react";

interface Props {
  show: boolean;
  configId: string;
  onClose: () => void;
  onRequestQrCode: () => Promise<void>;
  onRequestPairingCode: (phoneNumber: string) => Promise<void>;
  qrCode: string | null;
  pairingCode: string | null;
  loading: boolean;
}

export default function BaileysConnectionModal({
  show,
  onClose,
  onRequestQrCode,
  onRequestPairingCode,
  qrCode,
  pairingCode,
  loading,
}: Props) {
  const [mode, setMode] = useState<"qr" | "pairing">("qr");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");

  if (!show) return null;

  const handleRequestPairingCode = async () => {
    setError("");
    if (!phoneNumber || phoneNumber.length < 10) {
      setError("Enter a valid phone number with country code");
      return;
    }
    try {
      await onRequestPairingCode(phoneNumber);
    } catch {
      setError("Failed to generate pairing code. Please try again.");
    }
  };

  const handleRequestQrCode = async () => {
    setError("");
    try {
      await onRequestQrCode();
    } catch {
      setError("Failed to generate QR code. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="card w-full max-w-sm flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shrink-0">
              <QrCode className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-none">
                Connect WhatsApp
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Scan QR or use pairing code
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          <button
            onClick={() => {
              setMode("qr");
              setError("");
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium transition-colors border-b-2 ${
              mode === "qr"
                ? "border-brand-500 text-brand-400"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            QR Code
          </button>
          <button
            onClick={() => {
              setMode("pairing");
              setError("");
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium transition-colors border-b-2 ${
              mode === "pairing"
                ? "border-brand-500 text-brand-400"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Pairing Code
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
                {qrCode ? (
                  <div className="p-3 bg-white flex items-center justify-center">
                    <img
                      src={qrCode}
                      alt="QR Code"
                      className="w-48 h-48 object-contain block"
                    />
                  </div>
                ) : loading ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-3">
                    <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
                    <p className="text-xs text-gray-500">Generating QR code…</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 gap-3">
                    <QrCode className="w-10 h-10 text-gray-700" />
                    <p className="text-xs text-gray-500">
                      Click below to generate
                    </p>
                  </div>
                )}
              </div>

              {qrCode && (
                <div className="flex items-start gap-2 px-3 py-2 bg-yellow-900/20 border border-yellow-800/30 rounded-lg">
                  <AlertCircle className="w-3.5 h-3.5 text-yellow-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-400/80">
                    QR code expires in ~60 seconds. Refresh if expired.
                  </p>
                </div>
              )}

              {/* Steps */}
              <div className="space-y-2">
                {[
                  "Open WhatsApp on your phone",
                  <>
                    Tap <span className="text-white font-medium">Menu</span> →{" "}
                    <span className="text-white font-medium">
                      Linked Devices
                    </span>
                  </>,
                  <>
                    Tap{" "}
                    <span className="text-white font-medium">
                      Link a Device
                    </span>{" "}
                    and scan
                  </>,
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-brand-600/20 text-brand-400 text-[10px] font-bold flex items-center justify-center shrink-0">
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
                  className="btn-primary w-full justify-center"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <QrCode className="w-4 h-4" />
                  )}
                  {loading ? "Generating…" : "Generate QR Code"}
                </button>
              )}

              {qrCode && (
                <button
                  onClick={() => void handleRequestQrCode()}
                  disabled={loading}
                  className="btn-secondary w-full justify-center"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                  />
                  Refresh QR
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
                      <Smartphone className="w-8 h-8 text-brand-400" />
                      <p className="text-xs text-gray-400 text-center">
                        Enter your WhatsApp number with country code
                      </p>
                    </div>
                    <input
                      type="tel"
                      placeholder="628123456789"
                      className="input text-center text-base tracking-widest"
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value);
                        setError("");
                      }}
                    />
                    <p className="text-[10px] text-gray-600 text-center">
                      No + or spaces · e.g. 628123456789
                    </p>
                  </div>

                  <button
                    onClick={() => void handleRequestPairingCode()}
                    disabled={!phoneNumber || loading}
                    className="btn-primary w-full justify-center"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    {loading ? "Generating…" : "Get Pairing Code"}
                  </button>
                </>
              ) : (
                <div className="space-y-4">
                  {/* Code display */}
                  <div className="rounded-xl border border-brand-800/40 bg-brand-900/10 p-5 text-center space-y-2">
                    <p className="text-xs text-gray-500">Your pairing code</p>
                    <div className="text-3xl font-bold text-white tracking-[0.4em] font-mono py-2">
                      {pairingCode}
                    </div>
                    <p className="text-[10px] text-gray-600">
                      Valid for ~60 seconds
                    </p>
                  </div>

                  {/* Steps */}
                  <div className="space-y-2">
                    {[
                      "Open WhatsApp on your phone",
                      <>
                        Go to{" "}
                        <span className="text-white font-medium">Settings</span>{" "}
                        →{" "}
                        <span className="text-white font-medium">
                          Linked Devices
                        </span>
                      </>,
                      <>
                        Tap{" "}
                        <span className="text-white font-medium">
                          Link a Device
                        </span>
                      </>,
                      <>
                        Tap{" "}
                        <span className="text-white font-medium">
                          Link with phone number instead
                        </span>
                      </>,
                      "Enter the code above within 60 seconds",
                    ].map((step, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-brand-600/20 text-brand-400 text-[10px] font-bold flex items-center justify-center shrink-0">
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
                    className="btn-secondary w-full justify-center text-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Request New Code
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
            className="btn-secondary w-full justify-center"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
