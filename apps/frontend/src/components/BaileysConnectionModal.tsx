import { useState, useEffect } from "react";
import {
  X,
  QrCode,
  Smartphone,
  AlertCircle,
  RefreshCw,
  Check,
  Loader2,
  Copy,
  CheckCircle2,
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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (show && mode === "qr" && !qrCode && !loading && !isConnected) {
      void onRequestQrCode();
    }
  }, [show, mode]);

  useEffect(() => {
    if (!show || mode !== "qr" || !qrCode || isConnected) {
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
  }, [show, mode, qrCode, isConnected]);

  if (!show) return null;

  const handleCopyPairingCode = () => {
    if (!pairingCode) return;
    void navigator.clipboard.writeText(pairingCode.replace(/[^A-Za-z0-9]/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRequestPairingCode = async () => {
    setError("");
    const cleanPhone = phoneNumber.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      setError(t("sessions.error_phone", "Masukkan nomor WhatsApp yang valid (minimal 10 digit dengan kode negara, cth: 628123456789)"));
      return;
    }
    try {
      await onRequestPairingCode(cleanPhone);
    } catch {
      setError(t("sessions.error_pairing", "Gagal mendapatkan kode pairing. Silakan periksa kembali format nomor atau coba sesaat lagi."));
    }
  };

  const handleRequestQrCode = async () => {
    setError("");
    try {
      await onRequestQrCode();
    } catch {
      setError(t("sessions.error_qr", "Gagal memperbarui QR code. Silakan coba sesaat lagi."));
    }
  };

  // Render pairing code segments cleanly
  const renderPairingSegments = (code: string) => {
    const raw = code.replace(/[^A-Za-z0-9]/g, "");
    if (raw.length === 8) {
      const p1 = raw.slice(0, 4).split("");
      const p2 = raw.slice(4, 8).split("");
      return (
        <div className="flex items-center justify-center gap-1 sm:gap-1.5 my-2">
          {p1.map((ch, idx) => (
            <div
              key={`p1-${idx}`}
              className="w-8 h-10 sm:w-9 sm:h-11 flex items-center justify-center bg-gray-900 border border-emerald-500/40 rounded-lg text-lg sm:text-xl font-bold font-mono text-emerald-300 shadow-inner"
            >
              {ch}
            </div>
          ))}
          <span className="text-gray-500 font-bold text-lg px-1">-</span>
          {p2.map((ch, idx) => (
            <div
              key={`p2-${idx}`}
              className="w-8 h-10 sm:w-9 sm:h-11 flex items-center justify-center bg-gray-900 border border-emerald-500/40 rounded-lg text-lg sm:text-xl font-bold font-mono text-emerald-300 shadow-inner"
            >
              {ch}
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="text-2xl sm:text-3xl font-bold text-white tracking-[0.3em] font-mono py-2">
        {code}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="card w-full max-w-sm sm:max-w-md flex flex-col overflow-hidden max-h-[92vh] shadow-2xl border-gray-750">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-gray-900/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <QrCode className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-none">
                {t("sessions.scan_qr", "Hubungkan WhatsApp")}
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                {t("sessions.scan_qr_desc", "Pindai kode QR atau gunakan kode pairing 8 digit")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-gray-800"
            title={t("actions.close", "Tutup")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switch Tabs */}
        {!isConnected && (
          <div className="flex border-b border-gray-800 bg-gray-950/40">
            <button
              onClick={() => {
                setMode("qr");
                setError("");
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold transition-all border-b-2 ${
                mode === "qr"
                  ? "border-emerald-500 text-emerald-400 bg-emerald-950/20"
                  : "border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-850/30"
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>{t("provider_configs.qr_code", "Pindai QR Code")}</span>
            </button>
            <button
              onClick={() => {
                setMode("pairing");
                setError("");
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold transition-all border-b-2 ${
                mode === "pairing"
                  ? "border-emerald-500 text-emerald-400 bg-emerald-950/20"
                  : "border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-850/30"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{t("sessions.pairing_code", "Kode Pairing 8 Digit")}</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-red-900/30 border border-red-800/50 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          {/* ── Connected State ── */}
          {isConnected ? (
            <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-b from-emerald-950/40 to-gray-950 p-6 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40 shadow-lg shadow-emerald-500/20 animate-in zoom-in-75">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  {t("sessions.already_connected", "WhatsApp Berhasil Terhubung!")}
                </h3>
                <p className="text-xs text-emerald-400 font-medium">
                  {t("sessions.session_active", "Status Sesi: Aktif (Online)")}
                </p>
                <p className="text-xs text-gray-400 max-w-xs pt-1">
                  {t("sessions.already_connected_desc", "Perangkat Anda sudah terautentikasi dan sesi siap digunakan untuk mengirim serta menerima pesan otomatis.")}
                </p>
              </div>
              <button
                onClick={onClose}
                className="btn-primary w-full justify-center py-2.5 mt-2 shadow-lg shadow-brand-500/20"
              >
                {t("actions.done", "Selesai")}
              </button>
            </div>
          ) : mode === "qr" ? (
            /* ── QR Mode ── */
            <div className="space-y-4">
              {/* QR display card */}
              <div className="rounded-2xl border border-gray-800 bg-gray-950 p-4 flex flex-col items-center justify-center">
                {qrCode ? (
                  <div className="p-3 bg-white rounded-xl shadow-xl border border-emerald-500/20 flex items-center justify-center transition-transform hover:scale-[1.02]">
                    <img
                      src={qrCode}
                      alt="WhatsApp QR Code"
                      className="w-52 h-52 sm:w-56 sm:h-56 object-contain block"
                    />
                  </div>
                ) : loading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                    <p className="text-xs text-gray-400">
                      {t("actions.loading", "Membuat QR Code WhatsApp...")}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center border border-gray-800">
                      <QrCode className="w-6 h-6 text-gray-500" />
                    </div>
                    <p className="text-xs text-gray-400">
                      {t("sessions.click_generate", "Klik tombol di bawah untuk membuat QR Code")}
                    </p>
                  </div>
                )}
              </div>

              {/* Progress countdown */}
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
                </div>
              )}

              {/* Step instructions */}
              <div className="p-3.5 bg-gray-950/60 rounded-xl border border-gray-800/60 space-y-2">
                <p className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider">
                  {t("sessions.instructions", "Petunjuk:")}
                </p>
                {[
                  t("sessions.step_1", "Buka WhatsApp di ponsel Anda"),
                  t("sessions.step_2", "Pilih Menu (titik tiga) / Pengaturan > Perangkat Tertaut"),
                  t("sessions.step_3", "Pilih Tautkan Perangkat dan arahkan kamera ke kode di atas"),
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="w-4 h-4 rounded-full bg-emerald-600/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-xs text-gray-400 leading-tight">{step}</p>
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
                  {loading ? t("actions.saving", "Membuat...") : t("sessions.generate_qr", "Buat QR Code Baru")}
                </button>
              )}

              {qrCode && (
                <button
                  onClick={() => void handleRequestQrCode()}
                  disabled={loading}
                  className="btn-secondary w-full justify-center py-2.5 text-xs font-medium"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  {t("actions.refresh", "Segarkan QR Manual")}
                </button>
              )}
            </div>
          ) : (
            /* ── Pairing Mode ── */
            <div className="space-y-4">
              {!pairingCode ? (
                <>
                  <div className="rounded-2xl border border-gray-800 bg-gray-950 p-5 space-y-3.5">
                    <div className="flex flex-col items-center gap-2 pb-1 text-center">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-200">
                          {t("sessions.enter_phone", "Nomor WhatsApp")}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {t("sessions.enter_phone_desc", "Masukkan nomor dengan kode negara (contoh: 628123456789)")}
                        </p>
                      </div>
                    </div>

                    <input
                      type="tel"
                      placeholder="628123456789"
                      className="input text-center text-base tracking-widest font-mono font-bold py-2.5"
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value);
                        setError("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void handleRequestPairingCode();
                      }}
                    />
                    <p className="text-[10px] text-gray-500 text-center">
                      Tanpa tanda + atau spasi · format: 628xxxxxxxxxx
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
                    {pairingLoading ? t("actions.saving", "Memproses...") : t("sessions.get_pairing_code", "Dapatkan Kode Pairing")}
                  </button>
                </>
              ) : (
                <div className="space-y-4 animate-in fade-in">
                  {/* Code display card */}
                  <div className="rounded-2xl border border-emerald-800/40 bg-gradient-to-b from-emerald-950/30 to-gray-950 p-5 text-center space-y-3 shadow-lg">
                    <p className="text-xs text-gray-400 font-medium">
                      {t("sessions.your_pairing_code", "Kode Pairing Anda:")}
                    </p>

                    {renderPairingSegments(pairingCode)}

                    <div className="flex items-center justify-center gap-2 pt-1">
                      <button
                        onClick={handleCopyPairingCode}
                        className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition-colors"
                      >
                        {copied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copied ? t("actions.copied", "Kode Disalin!") : t("actions.copy_code", "Salin Kode")}</span>
                      </button>
                    </div>

                    <p className="text-[10px] text-gray-500">
                      {t("sessions.valid_seconds", "Kode berlaku sekitar 60 detik")}
                    </p>
                  </div>

                  {/* Steps */}
                  <div className="p-3.5 bg-gray-950/60 rounded-xl border border-gray-800/60 space-y-2">
                    <p className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider">
                      {t("sessions.instructions", "Petunjuk:")}
                    </p>
                    {[
                      t("sessions.pair_step_1", "Buka WhatsApp di ponsel Anda"),
                      t("sessions.pair_step_2", "Buka Perangkat Tertaut > Tautkan Perangkat"),
                      t("sessions.pair_step_3", "Pilih 'Tautkan dengan nomor telepon saja' di bagian bawah"),
                      t("sessions.pair_step_4", "Masukkan 8 digit kode di atas dalam 60 detik"),
                    ].map((step, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <span className="w-4 h-4 rounded-full bg-emerald-600/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-xs text-gray-400 leading-tight">{step}</p>
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
                    {t("sessions.request_new_code", "Minta Kode Baru / Ganti Nomor")}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-1">
          <button
            onClick={onClose}
            className="btn-secondary w-full justify-center py-2.5 text-xs font-medium"
          >
            {t("actions.close", "Tutup")}
          </button>
        </div>
      </div>
    </div>
  );
}
