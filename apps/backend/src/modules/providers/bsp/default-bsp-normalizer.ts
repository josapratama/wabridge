import { Injectable } from "@nestjs/common";
import { MESSAGE_STATUS, PROVIDER_TYPES } from "../../../common/constants";
import type {
  MessageStatus,
  ProviderWebhookEvent,
} from "../../../common/types";
import type { BspWebhookNormalizer } from "./bsp-webhook-normalizer.interface";

@Injectable()
export class DefaultBspNormalizer implements BspWebhookNormalizer {
  canHandle(payload: unknown): boolean {
    return (
      typeof payload === "object" && payload !== null && "event" in payload
    );
  }

  normalize(payload: unknown): ProviderWebhookEvent[] {
    if (!this.canHandle(payload)) return [];

    const p = payload as Record<string, unknown>;
    const eventType = String(p["event"] ?? "unknown");

    if (eventType === "message.inbound") {
      return [
        {
          eventType: "message.inbound",
          providerType: PROVIDER_TYPES.BSP,
          externalMessageId: String(p["messageId"] ?? ""),
          from: String(p["from"] ?? ""),
          to: String(p["to"] ?? ""),
          content: String(p["text"] ?? ""),
          messageType: "text",
          status: MESSAGE_STATUS.RECEIVED,
          timestamp: String(p["timestamp"] ?? new Date().toISOString()),
          rawPayload: p,
        },
      ];
    }

    if (eventType === "message.status") {
      return [
        {
          eventType: `message.${String(p["status"] ?? "unknown")}`,
          providerType: PROVIDER_TYPES.BSP,
          externalMessageId: String(p["messageId"] ?? ""),
          to: String(p["to"] ?? ""),
          status: this.mapStatus(String(p["status"] ?? "")),
          timestamp: String(p["timestamp"] ?? new Date().toISOString()),
          rawPayload: p,
        },
      ];
    }

    return [
      {
        eventType,
        providerType: PROVIDER_TYPES.BSP,
        rawPayload: p,
      },
    ];
  }

  private mapStatus(status: string): MessageStatus {
    const map: Record<string, MessageStatus> = {
      sent: MESSAGE_STATUS.SENT,
      delivered: MESSAGE_STATUS.DELIVERED,
      read: MESSAGE_STATUS.READ,
      failed: MESSAGE_STATUS.FAILED,
    };
    return map[status] ?? MESSAGE_STATUS.FAILED;
  }
}
