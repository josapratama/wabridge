import { Injectable } from "@nestjs/common";
import { HttpClient } from "../../../common/http/http-client";
import { AppLogger } from "../../../common/logger/app.logger";
import {
  META_CLOUD_DEFAULTS,
  MESSAGE_STATUS,
  PROVIDER_TYPES,
} from "../../../common/constants";
import type {
  ConnectAccountCommand,
  MessageStatus,
  ProviderAccountResult,
  ProviderHealthResult,
  ProviderWebhookEvent,
  SendMessageResult,
  SendTextMessageCommand,
  VerifyWebhookQuery,
  VerifyWebhookResult,
} from "../../../common/types";
import type { WhatsAppProvider } from "../whatsapp-provider.interface";

interface MetaTextMessagePayload {
  messaging_product: "whatsapp";
  recipient_type: "individual";
  to: string;
  type: "text";
  text: { preview_url: boolean; body: string };
}

interface MetaSendMessageResponse {
  messaging_product: string;
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
}

interface MetaWebhookEntry {
  id: string;
  changes: Array<{
    value: {
      messaging_product: string;
      metadata: { display_phone_number: string; phone_number_id: string };
      contacts?: Array<{ profile: { name: string }; wa_id: string }>;
      messages?: Array<{
        from: string;
        id: string;
        timestamp: string;
        type: string;
        text?: { body: string };
      }>;
      statuses?: Array<{
        id: string;
        status: string;
        timestamp: string;
        recipient_id: string;
        errors?: Array<{ code: number; title: string }>;
      }>;
    };
    field: string;
  }>;
}

interface MetaWebhookPayload {
  object: string;
  entry: MetaWebhookEntry[];
}

@Injectable()
export class MetaCloudWhatsAppProvider implements WhatsAppProvider {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly logger: AppLogger,
  ) {}

  async connectAccount(
    input: ConnectAccountCommand,
  ): Promise<ProviderAccountResult> {
    const { config } = input;
    const baseUrl = config.baseUrl ?? META_CLOUD_DEFAULTS.BASE_URL;
    const version = config.apiVersion ?? META_CLOUD_DEFAULTS.API_VERSION;
    const phoneNumberId = config.phoneNumberId;

    if (!phoneNumberId || !config.accessToken) {
      return {
        success: false,
        message: "phoneNumberId and accessToken are required for Meta Cloud",
      };
    }

    try {
      const url = `${baseUrl}/${version}/${phoneNumberId}`;
      const response = await this.httpClient.get<Record<string, unknown>>(url, {
        Authorization: `Bearer ${config.accessToken}`,
      });

      if (response.status === 200) {
        return {
          success: true,
          accountId: phoneNumberId,
          message: "Meta Cloud account connected successfully",
        };
      }

      return {
        success: false,
        message: `Meta Cloud returned status ${response.status}`,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      this.logger.error(
        `connectAccount failed: ${message}`,
        undefined,
        "MetaCloudProvider",
      );
      return { success: false, message };
    }
  }

  async verifyWebhook(query: VerifyWebhookQuery): Promise<VerifyWebhookResult> {
    const mode = query["hub.mode"] ?? query["mode"];
    const token = query["hub.verify_token"] ?? query["token"];
    const challenge = query["hub.challenge"] ?? query["challenge"];

    if (mode === "subscribe" && token && challenge) {
      return { valid: true, challenge };
    }

    return { valid: false };
  }

  async handleWebhook(
    payload: unknown,
    _headers?: Record<string, string>,
  ): Promise<ProviderWebhookEvent[]> {
    const events: ProviderWebhookEvent[] = [];

    if (!this.isMetaWebhookPayload(payload)) {
      this.logger.warn(
        "Received non-WhatsApp webhook payload",
        "MetaCloudProvider",
      );
      return events;
    }

    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        if (change.field !== "messages") continue;

        const value = change.value;

        if (value.messages) {
          for (const msg of value.messages) {
            if (msg.type === "text" && msg.text) {
              events.push({
                eventType: "message.inbound",
                providerType: PROVIDER_TYPES.META_CLOUD,
                externalMessageId: msg.id,
                from: msg.from,
                to: value.metadata.phone_number_id,
                content: msg.text.body,
                messageType: "text",
                status: MESSAGE_STATUS.RECEIVED,
                timestamp: msg.timestamp,
                rawPayload: msg as unknown as Record<string, unknown>,
              });
            }
          }
        }

        if (value.statuses) {
          for (const status of value.statuses) {
            const mappedStatus = this.mapMetaStatus(status.status);
            events.push({
              eventType: `message.${mappedStatus}`,
              providerType: PROVIDER_TYPES.META_CLOUD,
              externalMessageId: status.id,
              to: status.recipient_id,
              status: mappedStatus,
              timestamp: status.timestamp,
              rawPayload: status as unknown as Record<string, unknown>,
            });
          }
        }
      }
    }

    return events;
  }

  async sendTextMessage(
    input: SendTextMessageCommand,
  ): Promise<SendMessageResult> {
    const { to, message, config } = input;
    const baseUrl = config.baseUrl ?? META_CLOUD_DEFAULTS.BASE_URL;
    const version = config.apiVersion ?? META_CLOUD_DEFAULTS.API_VERSION;
    const phoneNumberId = config.phoneNumberId;

    if (!phoneNumberId || !config.accessToken) {
      return {
        success: false,
        error: "phoneNumberId and accessToken are required",
      };
    }

    const url = `${baseUrl}/${version}/${phoneNumberId}/messages`;

    const body: MetaTextMessagePayload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { preview_url: false, body: message },
    };

    try {
      const response = await this.httpClient.post<MetaSendMessageResponse>(
        url,
        body,
        {
          Authorization: `Bearer ${config.accessToken}`,
        },
      );

      if (response.status === 200 && response.data.messages?.[0]?.id) {
        return {
          success: true,
          externalMessageId: response.data.messages[0].id,
          rawResponse: response.data as unknown as Record<string, unknown>,
        };
      }

      return {
        success: false,
        error: `Unexpected response status: ${response.status}`,
        rawResponse: response.data as unknown as Record<string, unknown>,
      };
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : "Unknown error";
      this.logger.error(
        `sendTextMessage failed: ${error}`,
        undefined,
        "MetaCloudProvider",
      );
      return { success: false, error };
    }
  }

  async getHealth(configId?: string, sessionId?: string): Promise<ProviderHealthResult> {
    const baseUrl = META_CLOUD_DEFAULTS.BASE_URL;
    const start = Date.now();

    try {
      const response = await this.httpClient.get(`${baseUrl}/`);
      const latencyMs = Date.now() - start;

      return {
        healthy: response.status < 500,
        providerType: PROVIDER_TYPES.META_CLOUD,
        message: `Meta Graph API reachable (${response.status})`,
        latencyMs,
      };
    } catch (err: unknown) {
      return {
        healthy: false,
        providerType: PROVIDER_TYPES.META_CLOUD,
        message: err instanceof Error ? err.message : "Unreachable",
      };
    }
  }

  private isMetaWebhookPayload(
    payload: unknown,
  ): payload is MetaWebhookPayload {
    return (
      typeof payload === "object" &&
      payload !== null &&
      "object" in payload &&
      (payload as MetaWebhookPayload).object === "whatsapp_business_account" &&
      Array.isArray((payload as MetaWebhookPayload).entry)
    );
  }

  private mapMetaStatus(status: string): MessageStatus {
    const map: Record<string, MessageStatus> = {
      sent: MESSAGE_STATUS.SENT,
      delivered: MESSAGE_STATUS.DELIVERED,
      read: MESSAGE_STATUS.READ,
      failed: MESSAGE_STATUS.FAILED,
    };
    return map[status] ?? MESSAGE_STATUS.FAILED;
  }
}
