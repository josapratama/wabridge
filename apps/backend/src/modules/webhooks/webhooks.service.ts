import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { MESSAGE_STATUS } from "../../common/constants";
import type { ProviderType, VerifyWebhookQuery } from "../../common/types";
import {
  MessageRepository,
  ProviderConfigRepository,
} from "../../repositories/interfaces";
import { ProviderRoutingService } from "../provider-routing/provider-routing.service";
import { EventsService } from "../events/events.service";
import { AppLogger } from "../../common/logger/app.logger";

@Injectable()
export class WebhooksService {
  constructor(
    @Inject(ProviderConfigRepository)
    private readonly configRepo: ProviderConfigRepository,
    @Inject(MessageRepository)
    private readonly messageRepo: MessageRepository,
    private readonly routingService: ProviderRoutingService,
    private readonly eventsService: EventsService,
    private readonly logger: AppLogger,
  ) {}

  async verifyWebhook(
    providerType: ProviderType,
    query: VerifyWebhookQuery,
  ): Promise<string> {
    const config = await this.configRepo.findActiveByProviderType(providerType);
    if (!config) {
      throw new BadRequestException(
        `No active provider config found for ${providerType}`,
      );
    }

    const provider = this.routingService.getProvider(providerType);
    const result = await provider.verifyWebhook(query);

    if (!result.valid) {
      throw new BadRequestException("Webhook verification failed");
    }

    const incomingToken =
      query["hub.verify_token"] ?? query["verify_token"] ?? query["token"];

    if (config.verifyToken && incomingToken !== config.verifyToken) {
      this.logger.warn(
        `Webhook token mismatch for provider ${providerType}`,
        "WebhooksService",
      );
      throw new BadRequestException("Invalid verify token");
    }

    return result.challenge ?? "OK";
  }

  async handleWebhook(
    providerType: ProviderType,
    payload: unknown,
    headers: Record<string, string>,
  ): Promise<{ processed: number }> {
    this.logger.logStructured(
      "info",
      `Webhook received for ${providerType}`,
      { hasPayload: !!payload },
      "WebhooksService",
    );

    const provider = this.routingService.getProvider(providerType);
    const events = await provider.handleWebhook(payload, headers);

    let processed = 0;

    for (const event of events) {
      await this.eventsService.recordFromWebhookEvent(event);

      if (
        event.eventType === "message.inbound" &&
        event.from &&
        event.content
      ) {
        const now = new Date().toISOString();
        await this.messageRepo.save({
          id: crypto.randomUUID(),
          sessionId: event.sessionId ?? "",
          externalMessageId: event.externalMessageId,
          direction: "inbound",
          from: event.from,
          to: event.to ?? "",
          type: event.messageType ?? "text",
          content: event.content,
          status: MESSAGE_STATUS.RECEIVED,
          rawPayload: event.rawPayload,
          createdAt: now,
          updatedAt: now,
        });
      }

      if (
        event.externalMessageId &&
        event.status &&
        event.eventType !== "message.inbound"
      ) {
        const existing = await this.messageRepo.findByExternalMessageId(
          event.externalMessageId,
        );
        if (existing) {
          await this.messageRepo.update(existing.id, { status: event.status });
        }
      }

      processed++;
    }

    return { processed };
  }
}
