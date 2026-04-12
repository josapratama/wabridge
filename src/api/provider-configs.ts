import { request } from "./base";

export interface ProviderConfig {
  id: string;
  providerType: "meta-cloud" | "bsp" | "baileys";
  name: string;
  baseUrl?: string;
  apiVersion?: string;
  phoneNumberId?: string;
  wabaId?: string;
  accessToken?: string;
  verifyToken?: string;
  webhookSecret?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QrCodeResponse {
  qrCode?: string;
}
export interface PairingCodeResponse {
  pairingCode?: string;
}

export const providerConfigsApi = {
  list: () => request<ProviderConfig[]>("/provider-configs"),
  get: (id: string) => request<ProviderConfig>(`/provider-configs/${id}`),
  create: (body: Partial<ProviderConfig>) =>
    request<ProviderConfig>("/provider-configs", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id: string, body: Partial<ProviderConfig>) =>
    request<ProviderConfig>(`/provider-configs/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  activate: (id: string) =>
    request<ProviderConfig>(`/provider-configs/${id}/activate`, {
      method: "PATCH",
    }),
  deactivate: (id: string) =>
    request<ProviderConfig>(`/provider-configs/${id}/deactivate`, {
      method: "PATCH",
    }),
  getQrCode: (id: string) =>
    request<QrCodeResponse>(`/provider-configs/${id}/qr`),
  requestPairingCode: (id: string, phoneNumber: string) =>
    request<PairingCodeResponse>(`/provider-configs/${id}/pairing-code`, {
      method: "POST",
      body: JSON.stringify({ phoneNumber }),
    }),
};
