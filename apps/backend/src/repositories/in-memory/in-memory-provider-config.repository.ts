import { Injectable } from "@nestjs/common";
import type { ProviderConfig } from "../../common/types";
import { ProviderConfigRepository } from "../interfaces";

@Injectable()
export class InMemoryProviderConfigRepository extends ProviderConfigRepository {
  private readonly store = new Map<string, ProviderConfig>();

  async findById(id: string): Promise<ProviderConfig | null> {
    return this.store.get(id) ?? null;
  }

  async findAll(): Promise<ProviderConfig[]> {
    return Array.from(this.store.values());
  }

  async save(entity: ProviderConfig): Promise<ProviderConfig> {
    this.store.set(entity.id, { ...entity });
    return entity;
  }

  async update(
    id: string,
    partial: Partial<ProviderConfig>,
  ): Promise<ProviderConfig | null> {
    const existing = this.store.get(id);
    if (!existing) return null;
    const updated: ProviderConfig = {
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

  async findByProviderType(providerType: string): Promise<ProviderConfig[]> {
    return Array.from(this.store.values()).filter(
      (c) => c.providerType === providerType,
    );
  }

  async findActiveByProviderType(
    providerType: string,
  ): Promise<ProviderConfig | null> {
    for (const config of this.store.values()) {
      if (config.providerType === providerType && config.isActive) {
        return config;
      }
    }
    return null;
  }
}
