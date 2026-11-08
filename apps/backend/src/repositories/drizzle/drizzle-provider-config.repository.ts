import { Inject, Injectable } from "@nestjs/common";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq, and } from "drizzle-orm";
import { ProviderConfigRepository } from "../interfaces";
import { ProviderConfig } from "../../common/types";
import { DRIZZLE_CLIENT } from "../../common/database/database.module";
import * as schema from "../../common/database/drizzle/schema";

@Injectable()
export class DrizzleProviderConfigRepository implements ProviderConfigRepository {
  constructor(
    @Inject(DRIZZLE_CLIENT)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findById(id: string): Promise<ProviderConfig | null> {
    const results = await this.db
      .select()
      .from(schema.providerConfigs)
      .where(eq(schema.providerConfigs.id, id))
      .limit(1);

    if (results.length === 0) return null;
    const config = results[0];
    return {
      ...config,
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString(),
    } as ProviderConfig;
  }

  async findByProviderType(providerType: string): Promise<ProviderConfig[]> {
    const results = await this.db
      .select()
      .from(schema.providerConfigs)
      .where(eq(schema.providerConfigs.providerType, providerType));

    return results.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })) as ProviderConfig[];
  }

  async findActiveByProviderType(
    providerType: string,
  ): Promise<ProviderConfig | null> {
    const results = await this.db
      .select()
      .from(schema.providerConfigs)
      .where(
        and(
          eq(schema.providerConfigs.providerType, providerType),
          eq(schema.providerConfigs.isActive, true),
        ),
      )
      .limit(1);

    if (results.length === 0) return null;
    const config = results[0];
    return {
      ...config,
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString(),
    } as ProviderConfig;
  }

  async findAll(): Promise<ProviderConfig[]> {
    const results = await this.db.select().from(schema.providerConfigs);
    return results.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })) as ProviderConfig[];
  }

  async save(entity: ProviderConfig): Promise<ProviderConfig> {
    const results = await this.db
      .insert(schema.providerConfigs)
      .values({
        id: entity.id,
        providerType: entity.providerType,
        name: entity.name,
        baseUrl: entity.baseUrl,
        apiVersion: entity.apiVersion,
        phoneNumberId: entity.phoneNumberId,
        wabaId: entity.wabaId,
        accessToken: entity.accessToken,
        verifyToken: entity.verifyToken,
        webhookSecret: entity.webhookSecret,
        isActive: entity.isActive,
      })
      .returning();

    const config = results[0];
    return {
      ...config,
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString(),
    } as ProviderConfig;
  }

  async update(
    id: string,
    partial: Partial<ProviderConfig>,
  ): Promise<ProviderConfig | null> {
    const results = await this.db
      .update(schema.providerConfigs)
      .set({
        providerType: partial.providerType,
        name: partial.name,
        baseUrl: partial.baseUrl,
        apiVersion: partial.apiVersion,
        phoneNumberId: partial.phoneNumberId,
        wabaId: partial.wabaId,
        accessToken: partial.accessToken,
        verifyToken: partial.verifyToken,
        webhookSecret: partial.webhookSecret,
        isActive: partial.isActive,
        updatedAt: new Date(),
      })
      .where(eq(schema.providerConfigs.id, id))
      .returning();

    if (results.length === 0) return null;
    const config = results[0];
    return {
      ...config,
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString(),
    } as ProviderConfig;
  }

  async delete(id: string): Promise<boolean> {
    await this.db
      .delete(schema.providerConfigs)
      .where(eq(schema.providerConfigs.id, id));
    return true;
  }
}
