import { useState } from "react";
import {
  X,
  QrCode,
  Smartphone,
  AlertCircle,
  RefreshCw,
  Check,
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
  const [mode, setMode] = useState<"qr" | "pairing">("pairing");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");

  if (!show) return null;

  const handleRequestPairingCode = async () => {
    setError("");

    if (!phoneNumber || phoneNumber.length < 10) {
      setError("Please enter a valid phone number with country code");
      return;
    }

    try {
      await onRequestPairingCode(phoneNumber);
    } catch (err) {
      setError("Failed to generate pairing code. Please try again.");
    }
  };

  const handleRequestQrCode = async () => {
    setError("");
    try {
      await onRequestQrCode();
    } catch (err) {
      setError("Failed to generate QR code. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="card w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Connect WhatsApp
              </h2>
              <p className="text-xs text-gray-500">
                Choose your preferred method
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex gap-2 p-1 bg-gray-900/50 rounded-lg">
          <button
            onClick={() => setMode("qr")}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === "qr"
                ? "bg-green-500 text-white"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            <QrCode className="w-4 h-4 inline mr-2" />
            QR Code
          </button>
          <button
            onClick={() => setMode("pairing")}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === "pairing"
                ? "bg-green-500 text-white"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            <Smartphone className="w-4 h-4 inline mr-2" />
            Pairing Code
          </button>
        </div>

        <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
          {mode === "qr" ? (
            // QR Code Mode
            <>
              {!qrCode && !loading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <QrCode className="w-16 h-16 text-green-400" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-300 mb-1">
                      Ready to generate QR Code
                    </p>
                    <p className="text-xs text-gray-500">
                      Click the button below to start
                    </p>
                  </div>
                  {error && (
                    <div className="px-3 py-2 bg-red-900/30 border border-red-800/50 rounded-lg text-sm text-red-300">
                      {error}
                    </div>
                  )}
                  <button
                    onClick={() => void handleRequestQrCode()}
                    className="btn-primary"
                  >
                    <QrCode className="w-4 h-4" />
                    Generate QR Code
                  </button>
                </div>
              ) : loading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-700 border-t-green-500 rounded-full animate-spin" />
                    <Smartphone className="w-6 h-6 text-gray-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-300">
                      Generating QR Code...
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      This may take a moment
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg">
                    <img
                      src={qrCode || ""}
                      alt="QR Code"
                      className="w-full h-auto"
                    />
                  </div>
                  <div className="flex items-start gap-2 text-xs text-gray-400">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-400" />
                    <p className="leading-relaxed">
                      QR code expires in a few minutes. Try pairing code if QR
                      doesn't work.
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            // Pairing Code Mode
            <div className="space-y-4">
              {!pairingCode ? (
                <>
                  <div className="text-center py-4">
                    <Smartphone className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-300 mb-1">
                      Enter your phone number
                    </p>
                    <p className="text-xs text-gray-500">
                      Include country code (e.g., 628123456789)
                    </p>
                  </div>

                  {error && (
                    <div className="px-3 py-2 bg-red-900/30 border border-red-800/50 rounded-lg text-sm text-red-300">
                      {error}
                    </div>
                  )}

                  <input
                    type="tel"
                    placeholder="628123456789"
                    className="input w-full text-center text-lg"
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      setError("");
                    }}
                  />
                  <button
                    onClick={() => void handleRequestPairingCode()}
                    disabled={!phoneNumber || loading}
                    className="btn-primary w-full"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Get Pairing Code
                      </>
                    )}
                  </button>
                </>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10">
                    <Check className="w-8 h-8 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-2">
                      Your pairing code:
                    </p>
                    <div className="text-4xl font-bold text-white tracking-[0.5em] bg-gray-800/50 py-4 px-6 rounded-lg">
                      {pairingCode}
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-gray-400 text-left bg-blue-900/20 border border-blue-800/30 rounded-lg p-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-400" />
                    <div className="leading-relaxed">
                      <p className="font-medium text-blue-300 mb-1">
                        How to use:
                      </p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Open WhatsApp on your phone</li>
                        <li>Go to Settings → Linked Devices</li>
                        <li>Tap "Link a Device"</li>
                        <li>Tap "Link with phone number instead"</li>
                        <li>Enter this code within 1 minute</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {mode === "qr" && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <span className="text-green-400 font-semibold">1</span>
              </div>
              <p className="text-gray-300">Open WhatsApp on your phone</p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <span className="text-green-400 font-semibold">2</span>
              </div>
              <p className="text-gray-300">
                Tap <span className="font-medium text-white">Menu</span> →{" "}
                <span className="font-medium text-white">Linked Devices</span>
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <span className="text-green-400 font-semibold">3</span>
              </div>
              <p className="text-gray-300">
                Tap{" "}
                <span className="font-medium text-white">Link a Device</span>{" "}
                and scan
              </p>
            </div>
          </div>
        )}

        <button onClick={onClose} className="btn-secondary w-full">
          Close
        </button>
      </div>
    </div>
  );
}
