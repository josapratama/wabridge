import { Injectable } from "@nestjs/common";
import type { Session } from "../../common/types";
import { SessionRepository } from "../interfaces";

@Injectable()
export class InMemorySessionRepository extends SessionRepository {
  private readonly store = new Map<string, Session>();

  async findById(id: string): Promise<Session | null> {
    return this.store.get(id) ?? null;
  }

  async findAll(): Promise<Session[]> {
    return Array.from(this.store.values());
  }

  async findAllByUserId(userId: string): Promise<Session[]> {
    return Array.from(this.store.values()).filter((s) => s.userId === userId);
  }

  async save(entity: Session): Promise<Session> {
    this.store.set(entity.id, { ...entity });
    return entity;
  }

  async update(id: string, partial: Partial<Session>): Promise<Session | null> {
    const existing = this.store.get(id);
    if (!existing) return null;
    const updated: Session = {
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

  async findByProviderConfigId(providerConfigId: string): Promise<Session[]> {
    return Array.from(this.store.values()).filter(
      (s) => s.providerConfigId === providerConfigId,
    );
  }
}
