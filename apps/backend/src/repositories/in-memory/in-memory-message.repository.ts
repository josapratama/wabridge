import { Injectable } from "@nestjs/common";
import type { Message } from "../../common/types";
import { MessageRepository } from "../interfaces";

@Injectable()
export class InMemoryMessageRepository extends MessageRepository {
  private readonly store = new Map<string, Message>();

  async findById(id: string): Promise<Message | null> {
    return this.store.get(id) ?? null;
  }

  async findAll(): Promise<Message[]> {
    return Array.from(this.store.values());
  }

  async save(entity: Message): Promise<Message> {
    this.store.set(entity.id, { ...entity });
    return entity;
  }

  async update(id: string, partial: Partial<Message>): Promise<Message | null> {
    const existing = this.store.get(id);
    if (!existing) return null;
    const updated: Message = {
      ...existing,
      ...partial,
      id,
      updatedAt: new Date().toISOString(),
    };
    this.store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.store.delete(id);
  }

  async findBySessionId(sessionId: string): Promise<Message[]> {
    return Array.from(this.store.values()).filter(
      (m) => m.sessionId === sessionId,
    );
  }

  async findByExternalMessageId(
    externalMessageId: string,
  ): Promise<Message | null> {
    for (const msg of this.store.values()) {
      if (msg.externalMessageId === externalMessageId) return msg;
    }
    return null;
  }

  async findRecentByJid(jid: string, limit = 10): Promise<Message[]> {
    const cleanJid = jid.replace(/:\d+@/, "@");
    return Array.from(this.store.values())
      .filter((m) => m.from === cleanJid || m.to === cleanJid)
      .slice(-limit);
  }
}
