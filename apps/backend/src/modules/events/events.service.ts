import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import type { ProviderEvent, ProviderWebhookEvent } from "../../common/types";
import { EventRepository } from "../../repositories/interfaces";

@Injectable()
export class EventsService {
  constructor(
    @Inject(EventRepository)
    private readonly repo: EventRepository,
  ) {}

  async recordFromWebhookEvent(
    webhookEvent: ProviderWebhookEvent,
    sessionId?: string,
  ): Promise<ProviderEvent> {
    const event: ProviderEvent = {
      id: uuidv4(),
      sessionId: sessionId ?? webhookEvent.sessionId,
      providerType: webhookEvent.providerType,
      eventType: webhookEvent.eventType,
      payload: webhookEvent.rawPayload,
      processed: false,
      createdAt: new Date().toISOString(),
    };
    return this.repo.save(event);
  }

  async recordRaw(
    providerType: ProviderEvent["providerType"],
    eventType: string,
    payload: Record<string, unknown>,
    sessionId?: string,
  ): Promise<ProviderEvent> {
    const event: ProviderEvent = {
      id: uuidv4(),
      sessionId,
      providerType,
      eventType,
      payload,
      processed: false,
      createdAt: new Date().toISOString(),
    };
    return this.repo.save(event);
  }

  async markProcessed(id: string): Promise<ProviderEvent> {
    const updated = await this.repo.update(id, { processed: true });
    if (!updated) throw new NotFoundException(`Event ${id} not found`);
    return updated;
  }

  async findAll(sessionIds?: string[]): Promise<ProviderEvent[]> {
    const all = await this.repo.findAll();
    if (sessionIds) {
      return all.filter((e) => e.sessionId && sessionIds.includes(e.sessionId));
    }
    return all;
  }

  async findById(id: string): Promise<ProviderEvent> {
    const event = await this.repo.findById(id);
    if (!event) throw new NotFoundException(`Event ${id} not found`);
    return event;
  }
}
