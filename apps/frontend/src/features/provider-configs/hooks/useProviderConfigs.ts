import { useState, useEffect } from "react";
import { providerConfigsApi, ProviderConfig } from "../../../api/client";

export type QrModalState = {
  show: boolean;
  configId: string;
  qrCode: string | null;
  pairingCode: string | null;
  isConnected?: boolean;
};

const CLOSED_QR: QrModalState = {
  show: false,
  configId: "",
  qrCode: null,
  pairingCode: null,
  isConnected: false,
};

export function useProviderConfigs() {
  const [configs, setConfigs] = useState<ProviderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrModal, setQrModal] = useState<QrModalState>(CLOSED_QR);
  const [qrLoading, setQrLoading] = useState(false);
  const [pairingLoading, setPairingLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await providerConfigsApi.list();
    if (res.data) setConfigs(res.data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const create = async (form: Partial<ProviderConfig>) => {
    // Strip empty fields
    const cleaned: Partial<ProviderConfig> = {
      providerType: form.providerType,
      name: form.name,
    };
    if (form.baseUrl) cleaned.baseUrl = form.baseUrl;
    if (form.apiVersion) cleaned.apiVersion = form.apiVersion;
    if (form.phoneNumberId) cleaned.phoneNumberId = form.phoneNumberId;
    if (form.wabaId) cleaned.wabaId = form.wabaId;
    if (form.verifyToken) cleaned.verifyToken = form.verifyToken;
    if (form.webhookSecret) cleaned.webhookSecret = form.webhookSecret;
    if (form.providerType !== "baileys" && form.accessToken)
      cleaned.accessToken = form.accessToken;

    const res = await providerConfigsApi.create(cleaned);
    if (res.success) await load();
    return res;
  };

  const toggle = async (cfg: ProviderConfig) => {
    if (cfg.isActive) {
      await providerConfigsApi.deactivate(cfg.id);
    } else {
      await providerConfigsApi.activate(cfg.id);
      if (cfg.providerType === "baileys") openQrModal(cfg.id);
    }
    await load();
  };

  const openQrModal = (configId: string) => {
    setQrModal({ show: true, configId, qrCode: null, pairingCode: null });
    void generateQrCode(configId);
  };

  const closeQrModal = () => {
    setQrModal(CLOSED_QR);
    setQrLoading(false);
  };

  const generateQrCode = async (configId?: string) => {
    const targetId = configId || qrModal.configId;
    if (!targetId) return;
    setQrLoading(true);
    setQrModal((prev) => ({ ...prev, qrCode: null, isConnected: false }));

    let attempts = 0;
    const maxAttempts = 20;
    const poll = async () => {
      attempts++;
      const res = await providerConfigsApi.getQrCode(targetId);
      if (res.data?.isConnected) {
        setQrModal((prev) => ({ ...prev, isConnected: true, qrCode: null }));
        setQrLoading(false);
        return;
      }
      if (res.data?.qrCode) {
        setQrModal((prev) => ({ ...prev, qrCode: res.data?.qrCode ?? null, isConnected: false }));
        setQrLoading(false);
        return;
      }
      if (attempts < maxAttempts) {
        setTimeout(() => void poll(), 1500);
      } else {
        setQrLoading(false);
      }
    };
    await poll();
  };

  const requestPairingCode = async (phoneNumber: string) => {
    if (!phoneNumber) return;
    setPairingLoading(true);
    try {
      const res = await providerConfigsApi.requestPairingCode(
        qrModal.configId,
        phoneNumber,
      );
      if (res.data?.pairingCode) {
        setQrModal((prev) => ({
          ...prev,
          pairingCode: res.data?.pairingCode ?? null,
        }));
      }
    } finally {
      setPairingLoading(false);
    }
  };

  return {
    configs,
    loading,
    load,
    create,
    toggle,
    qrModal,
    qrLoading,
    pairingLoading,
    openQrModal,
    closeQrModal,
    generateQrCode,
    requestPairingCode,
  };
}
