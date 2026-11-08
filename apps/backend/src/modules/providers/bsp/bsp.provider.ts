import { Injectable } from "@nestjs/common";
import { HttpClient } from "../../../common/http/http-client";
import { AppLogger } from "../../../common/logger/app.logger";
import { PROVIDER_TYPES } from "../../../common/constants";
import type {
  ConnectAccountCommand,
  ProviderAccountResult,
  ProviderHealthResult,
  ProviderWebhookEvent,
  SendMessageResult,
  SendTextMessageCommand,
  VerifyWebhookQuery,
  VerifyWebhookResult,
} from "../../../common/types";
import type { WhatsAppProvider } from "../whatsapp-provider.interface";
import type { BspWebhookNormalizer } from "./bsp-webhook-normalizer.interface";
import { DefaultBspNormalizer } from "./default-bsp-normalizer";

@Injectable()
export class BspWhatsAppProvider implements WhatsAppProvider {
  private readonly normalizers: BspWebhookNormalizer[];

  constructor(
    private readonly httpClient: HttpClient,
    private readonly logger: AppLogger,
    private readonly defaultNormalizer: DefaultBspNormalizer,
  ) {
    this.normalizers = [defaultNormalizer];
  }

  registerNormalizer(normalizer: BspWebhookNormalizer): void {
    this.normalizers.unshift(normalizer);
  }

  async connectAccount(
    input: ConnectAccountCommand,
  ): Promise<ProviderAccountResult> {
    const { config } = input;

    if (!config.baseUrl || !config.accessToken) {
      return {
        success: false,
        message: "baseUrl and accessToken are required for BSP provider",
      };
    }

    try {
      const url = `${config.baseUrl}/health`;
      const response = await this.httpClient.get(url, {
        Authorization: `Bearer ${config.accessToken}`,
      });

      if (response.status < 400) {
        return { success: true, message: "BSP account connected successfully" };
      }

      return {
        success: false,
        message: `BSP returned status ${response.status}`,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      this.logger.warn(
        `BSP connectAccount failed (health check skipped): ${message}`,
        "BspProvider",
      );
      return {
        success: true,
        message: "BSP config saved (health check skipped)",
      };
    }
  }

  async verifyWebhook(query: VerifyWebhookQuery): Promise<VerifyWebhookResult> {
    const mode = query["hub.mode"] ?? query["mode"];
    const token =
      query["hub.verify_token"] ?? query["verify_token"] ?? query["token"];
    const challenge = query["hub.challenge"] ?? query["challenge"];

    if (token && challenge) {
      return { valid: true, challenge };
    }

    if (token) {
      return { valid: true };
    }

    return { valid: false };
  }

  async handleWebhook(
    payload: unknown,
    headers?: Record<string, string>,
  ): Promise<ProviderWebhookEvent[]> {
    this.logger.logStructured(
      "debug",
      "BSP webhook received",
      { hasSignature: !!headers?.["x-hub-signature-256"] },
      "BspProvider",
    );

    const normalizer = this.normalizers.find((n) => n.canHandle(payload));

    if (!normalizer) {
      this.logger.warn("No BSP normalizer found for payload", "BspProvider");
      return [
        {
          eventType: "webhook.unknown",
          providerType: PROVIDER_TYPES.BSP,
          rawPayload:
            typeof payload === "object" && payload !== null
              ? (payload as Record<string, unknown>)
              : { raw: payload },
        },
      ];
    }

    return normalizer.normalize(payload);
  }

  async sendTextMessage(
    input: SendTextMessageCommand,
  ): Promise<SendMessageResult> {
    const { to, message, config } = input;

    if (!config.baseUrl || !config.accessToken) {
      return {
        success: false,
        error: "baseUrl and accessToken are required for BSP",
      };
    }

    const url = `${config.baseUrl}/messages/send`;
    const body = { to, type: "text", text: message };

    try {
      const response = await this.httpClient.post<Record<string, unknown>>(
        url,
        body,
        {
          Authorization: `Bearer ${config.accessToken}`,
        },
      );

      if (response.status >= 200 && response.status < 300) {
        const externalId =
          (response.data["messageId"] as string) ??
          (response.data["id"] as string) ??
          undefined;

        return {
          success: true,
          externalMessageId: externalId,
          rawResponse: response.data,
        };
      }

      return {
        success: false,
        error: `BSP returned status ${response.status}`,
        rawResponse: response.data,
      };
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : "Unknown error";
      this.logger.error(
        `BSP sendTextMessage failed: ${error}`,
        undefined,
        "BspProvider",
      );
      return { success: false, error };
    }
  }

  async getHealth(configId?: string, sessionId?: string): Promise<ProviderHealthResult> {
    return {
      healthy: true,
      providerType: PROVIDER_TYPES.BSP,
      message: "BSP provider configured (health depends on runtime config)",
    };
  }
}
