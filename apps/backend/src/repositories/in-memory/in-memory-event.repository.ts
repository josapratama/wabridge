import { Injectable } from "@nestjs/common";
import type { ProviderEvent } from "../../common/types";
import { EventRepository } from "../interfaces";

@Injectable()
export class InMemoryEventRepository extends EventRepository {
  private readonly store = new Map<string, ProviderEvent>();

  async findById(id: string): Promise<ProviderEvent | null> {
    return this.store.get(id) ?? null;
  }

  async findAll(): Promise<ProviderEvent[]> {
    return Array.from(this.store.values());
  }

  async save(entity: ProviderEvent): Promise<ProviderEvent> {
    this.store.set(entity.id, { ...entity });
    return entity;
  }

  async update(
    id: string,
    partial: Partial<ProviderEvent>,
  ): Promise<ProviderEvent | null> {
    const existing = this.store.get(id);
    if (!existing) return null;
    const updated: ProviderEvent = { ...existing, ...partial, id };
    this.store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.store.delete(id);
  }

  async findBySessionId(sessionId: string): Promise<ProviderEvent[]> {
    return Array.from(this.store.values()).filter(
      (e) => e.sessionId === sessionId,
    );
  }

  async findUnprocessed(): Promise<ProviderEvent[]> {
    return Array.from(this.store.values()).filter((e) => !e.processed);
  }
}
